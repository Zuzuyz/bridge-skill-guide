/**
 * SkillBridge Phase 4B — SQL Sandbox Execution Service
 *
 * Executes student SQL queries against in-memory SQLite databases using
 * Python's built-in sqlite3 module (via child_process.spawn).
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  PRODUCTION WARNING                                                 ║
 * ║                                                                     ║
 * ║  This implementation runs SQL in Python's sqlite3 via subprocess.   ║
 * ║  It is safe from affecting the production PostgreSQL database.      ║
 * ║                                                                     ║
 * ║  For production deployment, consider:                               ║
 * ║    • A dedicated read-only database replica                         ║
 * ║    • Row-level security with per-session schemas                    ║
 * ║    • A containerised SQL execution environment                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import { randomUUID } from "crypto";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import { tmpdir } from "os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SqlExecutionResult {
  passed: boolean;
  executionTimeMs: number;
  studentResult: Record<string, unknown>[];
  expectedResult: Record<string, unknown>[];
  error: string | null;
  rowsReturned: number;
  explanation?: string;
}

// ---------------------------------------------------------------------------
// Safety — reject DML / DDL from student queries
// ---------------------------------------------------------------------------

const UNSAFE_SQL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(INSERT)\b/i, label: "INSERT" },
  { pattern: /\b(UPDATE)\b/i, label: "UPDATE" },
  { pattern: /\b(DELETE)\b/i, label: "DELETE" },
  { pattern: /\b(DROP)\b/i, label: "DROP" },
  { pattern: /\b(ALTER)\b/i, label: "ALTER" },
  { pattern: /\b(TRUNCATE)\b/i, label: "TRUNCATE" },
  { pattern: /\b(CREATE)\b/i, label: "CREATE" },
  { pattern: /\b(GRANT)\b/i, label: "GRANT" },
  { pattern: /\b(REVOKE)\b/i, label: "REVOKE" },
  { pattern: /\b(EXEC|EXECUTE)\b/i, label: "EXEC/EXECUTE" },
  { pattern: /;[\s\S]*\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/i, label: "Multi-statement DML" },
];

export function validateSqlSafety(sql: string): { safe: boolean; reason?: string } {
  const trimmed = sql.trim();

  if (!trimmed) {
    return { safe: false, reason: "Empty SQL query." };
  }

  for (const { pattern, label } of UNSAFE_SQL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: `Prohibited SQL operation: ${label}. Only SELECT queries are allowed.` };
    }
  }

  // Ensure it starts with SELECT or WITH (CTE)
  if (!/^\s*(SELECT|WITH)\b/i.test(trimmed)) {
    return { safe: false, reason: "Only SELECT queries (including WITH/CTE) are allowed." };
  }

  return { safe: true };
}

// ---------------------------------------------------------------------------
// Sanitize schema for client display
// ---------------------------------------------------------------------------

export function sanitizeSqlSchemaForClient(dbSchema: string): string {
  // The DDL schema is safe to show students — it helps them understand the tables
  return dbSchema;
}

// ---------------------------------------------------------------------------
// Python SQLite executor script template
// ---------------------------------------------------------------------------

function buildSqlRunnerScript(): string {
  return `
import sqlite3
import json
import sys
import traceback

def run():
    conn = None
    try:
        with open("sql_params.json", "r", encoding="utf-8") as f:
            params = json.load(f)

        db_schema = params.get("dbSchema", "")
        initial_data = params.get("initialData", "")
        student_sql = params.get("studentSql", "")
        expected_sql = params.get("expectedQuery", "")

        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Create schema
        cursor.executescript(db_schema)

        # Insert fixture data
        cursor.executescript(initial_data)
        conn.commit()

        # Execute expected/reference query
        cursor.execute(expected_sql)
        expected_cols = [desc[0] for desc in cursor.description] if cursor.description else []
        expected_rows = []
        for row in cursor.fetchall():
            row_dict = {}
            for i, col in enumerate(expected_cols):
                val = row[i]
                if isinstance(val, float) and val == int(val):
                    val = int(val)
                row_dict[col.lower()] = val
            expected_rows.append(row_dict)

        # Execute student query
        cursor.execute(student_sql)
        student_cols = [desc[0] for desc in cursor.description] if cursor.description else []
        student_rows = []
        for row in cursor.fetchall():
            row_dict = {}
            for i, col in enumerate(student_cols):
                val = row[i]
                if isinstance(val, float) and val == int(val):
                    val = int(val)
                row_dict[col.lower()] = val
            student_rows.append(row_dict)

        # Compare results
        passed = student_rows == expected_rows

        if not passed:
            sorted_student = sorted(student_rows, key=lambda r: json.dumps(r, sort_keys=True, default=str))
            sorted_expected = sorted(expected_rows, key=lambda r: json.dumps(r, sort_keys=True, default=str))
            if sorted_student == sorted_expected:
                passed = True

        result = {
            "passed": passed,
            "studentResult": student_rows,
            "expectedResult": expected_rows,
            "rowsReturned": len(student_rows),
            "error": None
        }
        print(json.dumps(result, default=str))

    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        result = {
            "passed": False,
            "studentResult": [],
            "expectedResult": [],
            "rowsReturned": 0,
            "error": error_msg
        }
        print(json.dumps(result, default=str))

    finally:
        if conn:
            conn.close()

run()
`;
}

// ---------------------------------------------------------------------------
// Core execution
// ---------------------------------------------------------------------------

const DEFAULT_SQL_TIMEOUT_MS = 5_000;

export async function executeSqlQuery(params: {
  studentSql: string;
  dbSchema: string;
  initialData: string;
  expectedQuery: string;
  timeoutMs?: number;
}): Promise<SqlExecutionResult> {
  const { studentSql, dbSchema, initialData, expectedQuery, timeoutMs = DEFAULT_SQL_TIMEOUT_MS } = params;

  // Safety check
  const safety = validateSqlSafety(studentSql);
  if (!safety.safe) {
    return {
      passed: false,
      executionTimeMs: 0,
      studentResult: [],
      expectedResult: [],
      error: safety.reason || "Unsafe SQL detected.",
      rowsReturned: 0,
    };
  }

  // Prepare temp directory
  const execId = randomUUID();
  const tempDir = join(tmpdir(), `skillbridge-sql-${execId}`);

  try {
    mkdirSync(tempDir, { recursive: true });

    // Write parameters to JSON file
    writeFileSync(
      join(tempDir, "sql_params.json"),
      JSON.stringify({ studentSql, dbSchema, initialData, expectedQuery }),
      "utf-8"
    );

    const runnerScript = buildSqlRunnerScript();
    const scriptPath = join(tempDir, "sql_runner.py");
    writeFileSync(scriptPath, runnerScript, "utf-8");

    // Execute with cwd
    const startTime = Date.now();
    const result = await runPythonScript(scriptPath, tempDir, timeoutMs);
    const executionTimeMs = Date.now() - startTime;

    if (result.error) {
      return {
        passed: false,
        executionTimeMs,
        studentResult: [],
        expectedResult: [],
        error: result.error,
        rowsReturned: 0,
      };
    }

    // Parse the JSON output
    try {
      const parsed = JSON.parse(result.stdout.trim());
      return {
        passed: parsed.passed ?? false,
        executionTimeMs,
        studentResult: parsed.studentResult ?? [],
        expectedResult: parsed.expectedResult ?? [],
        error: parsed.error ?? null,
        rowsReturned: parsed.rowsReturned ?? 0,
      };
    } catch {
      return {
        passed: false,
        executionTimeMs,
        studentResult: [],
        expectedResult: [],
        error: `Failed to parse SQL execution results. Raw output: ${result.stdout.slice(0, 500)}`,
        rowsReturned: 0,
      };
    }
  } finally {
    try {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

// ---------------------------------------------------------------------------
// Python process spawner
// ---------------------------------------------------------------------------

function runPythonScript(
  scriptPath: string,
  workDir: string,
  timeoutMs: number
): Promise<{ stdout: string; error: string | null }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let killed = false;

    const proc = spawn("python3", [scriptPath], {
      cwd: workDir,
      timeout: timeoutMs,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONDONTWRITEBYTECODE: "1",
        PYTHONUNBUFFERED: "1",
      },
    });

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
    }, timeoutMs);

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      clearTimeout(timer);

      if (killed) {
        resolve({
          stdout,
          error: `Time Limit Exceeded: Your SQL query did not complete within ${Math.round(timeoutMs / 1000)} seconds.`,
        });
        return;
      }

      if (code !== 0) {
        const errorLines = stderr.trim().split("\n");
        const lastError = errorLines.slice(-3).join("\n");
        resolve({
          stdout,
          error: `SQL Execution Error:\n${lastError}`,
        });
        return;
      }

      resolve({ stdout, error: null });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        stdout,
        error: `Failed to start Python process: ${err.message}. Ensure Python 3 is installed.`,
      });
    });
  });
}

/**
 * SkillBridge Phase 4B — Isolated Code Execution Service
 *
 * Executes student Python code against test cases using child_process.spawn
 * with timeout enforcement, temp-file isolation, and basic safety checks.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  PRODUCTION WARNING                                                 ║
 * ║                                                                     ║
 * ║  This implementation uses child_process.spawn directly on the host. ║
 * ║  It is suitable ONLY for development / trusted demo environments.   ║
 * ║                                                                     ║
 * ║  For production deployment you MUST use one of:                     ║
 * ║    • Docker containers with resource limits (--memory, --cpus)      ║
 * ║    • Firecracker microVMs                                           ║
 * ║    • A sandboxed code execution API (e.g. Judge0, Piston)           ║
 * ║                                                                     ║
 * ║  The abstraction layer is designed so you can swap the backend      ║
 * ║  without changing any caller code.                                  ║
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

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
  points?: number;
}

export interface TestResult {
  testIndex: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isHidden: boolean;
}

export interface CodeExecutionResult {
  passed: boolean;
  passedTests: number;
  totalTests: number;
  executionTimeMs: number;
  output: string;
  error: string | null;
  testResults: TestResult[];
}

// ---------------------------------------------------------------------------
// Safety — basic blocklist (NOT a production sandbox)
// ---------------------------------------------------------------------------

const UNSAFE_PYTHON_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bimport\s+os\b/, label: "import os" },
  { pattern: /\bfrom\s+os\b/, label: "from os" },
  { pattern: /\bimport\s+subprocess\b/, label: "import subprocess" },
  { pattern: /\bfrom\s+subprocess\b/, label: "from subprocess" },
  { pattern: /\bimport\s+shutil\b/, label: "import shutil" },
  { pattern: /\bfrom\s+shutil\b/, label: "from shutil" },
  { pattern: /\bimport\s+socket\b/, label: "import socket" },
  { pattern: /\bfrom\s+socket\b/, label: "from socket" },
  { pattern: /\b__import__\s*\(/, label: "__import__()" },
  { pattern: /\beval\s*\(/, label: "eval()" },
  { pattern: /\bexec\s*\(/, label: "exec()" },
  { pattern: /\bsys\.exit\b/, label: "sys.exit" },
  { pattern: /\bopen\s*\(/, label: "open() — file access" },
];

function validateCodeSafety(code: string): { safe: boolean; reason?: string } {
  for (const { pattern, label } of UNSAFE_PYTHON_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `Prohibited operation detected: ${label}` };
    }
  }
  return { safe: true };
}

// ---------------------------------------------------------------------------
// Sanitize test cases for client (strip hidden ones)
// ---------------------------------------------------------------------------

export function sanitizeTestCasesForClient(testCases: TestCase[]): TestCase[] {
  return testCases
    .filter((tc) => !tc.isHidden)
    .map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: false as const,
      ...(tc.explanation !== undefined ? { explanation: tc.explanation } : {}),
    }));
}

// ---------------------------------------------------------------------------
// Python wrapper template
// ---------------------------------------------------------------------------

function buildPythonRunner(studentCode: string): string {
  return `
import sys
import json
import traceback

# ---- Student Code ----
${studentCode}

# ---- Test Runner ----
def _run_tests():
    try:
        with open("test_cases.json", "r", encoding="utf-8") as f:
            test_cases = json.load(f)
    except Exception as e:
        print(json.dumps({"results": [], "error": f"Failed to load test cases: {str(e)}"}))
        return

    results = []

    for i, tc in enumerate(test_cases):
        try:
            # Parse the input
            inp = tc.get("input", "")
            if isinstance(inp, str):
                try:
                    input_data = json.loads(inp)
                except Exception:
                    input_data = {"args": [inp]}
            else:
                input_data = inp

            args = input_data.get("args", [])
            kwargs = input_data.get("kwargs", {})

            # Find the callable
            func_name = input_data.get("function", None)
            if func_name and func_name in globals():
                func = globals()[func_name]
            else:
                import types
                user_funcs = [name for name, obj in list(globals().items())
                              if isinstance(obj, types.FunctionType)
                              and not name.startswith('_')]
                if not user_funcs:
                    results.append({
                        "testIndex": i,
                        "passed": False,
                        "actualOutput": "ERROR: No function found in student code",
                        "error": True
                    })
                    continue
                func = globals()[user_funcs[0]]

            result = func(*args, **kwargs)
            actual_output = json.dumps(result, default=str)
            
            # Compare output
            expected_raw = tc.get("expectedOutput", "")
            if isinstance(expected_raw, str):
                try:
                    expected_parsed = json.loads(expected_raw)
                    actual_parsed = json.loads(actual_output)
                    passed = actual_parsed == expected_parsed
                    if not passed and isinstance(actual_parsed, list) and isinstance(expected_parsed, list):
                        try:
                            passed = sorted(actual_parsed) == sorted(expected_parsed)
                        except Exception:
                            pass
                except Exception:
                    passed = str(actual_output).strip() == str(expected_raw).strip()
            else:
                try:
                    actual_parsed = json.loads(actual_output)
                    passed = actual_parsed == expected_raw
                except Exception:
                    passed = False

            results.append({
                "testIndex": i,
                "passed": passed,
                "actualOutput": actual_output
            })
        except Exception as e:
            results.append({
                "testIndex": i,
                "passed": False,
                "actualOutput": f"ERROR: {type(e).__name__}: {str(e)}",
                "error": True
            })

    print(json.dumps({"results": results}))

_run_tests()
`;
}

// ---------------------------------------------------------------------------
// Core execution
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 10_000;

export async function executeCode(params: {
  language: string;
  sourceCode: string;
  testCases: TestCase[];
  timeoutMs?: number;
}): Promise<CodeExecutionResult> {
  const { language, sourceCode, testCases, timeoutMs = DEFAULT_TIMEOUT_MS } = params;

  // Only Python is supported in Phase 4B
  if (language !== "python") {
    return {
      passed: false,
      passedTests: 0,
      totalTests: testCases.length,
      executionTimeMs: 0,
      output: "",
      error: `Unsupported language: ${language}. Only Python is supported.`,
      testResults: testCases.map((tc, i) => ({
        testIndex: i,
        passed: false,
        input: tc.isHidden ? "[hidden]" : tc.input,
        expectedOutput: tc.isHidden ? "[hidden]" : tc.expectedOutput,
        actualOutput: "Not executed",
        isHidden: tc.isHidden,
      })),
    };
  }

  // Safety check
  const safety = validateCodeSafety(sourceCode);
  if (!safety.safe) {
    return {
      passed: false,
      passedTests: 0,
      totalTests: testCases.length,
      executionTimeMs: 0,
      output: "",
      error: safety.reason || "Code contains prohibited operations.",
      testResults: testCases.map((tc, i) => ({
        testIndex: i,
        passed: false,
        input: tc.isHidden ? "[hidden]" : tc.input,
        expectedOutput: tc.isHidden ? "[hidden]" : tc.expectedOutput,
        actualOutput: "Not executed — safety violation",
        isHidden: tc.isHidden,
      })),
    };
  }

  // Prepare temp directory
  const execId = randomUUID();
  const tempDir = join(tmpdir(), `skillbridge-code-${execId}`);

  try {
    mkdirSync(tempDir, { recursive: true });

    // Write test cases file
    const testCasesForRunner = testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));
    writeFileSync(join(tempDir, "test_cases.json"), JSON.stringify(testCasesForRunner), "utf-8");

    const runnerCode = buildPythonRunner(sourceCode);
    const scriptPath = join(tempDir, "solution.py");
    writeFileSync(scriptPath, runnerCode, "utf-8");

    // Execute from the tempDir working directory
    const startTime = Date.now();
    const result = await runPython(scriptPath, tempDir, timeoutMs);
    const executionTimeMs = Date.now() - startTime;

    // Parse output
    if (result.error) {
      return {
        passed: false,
        passedTests: 0,
        totalTests: testCases.length,
        executionTimeMs,
        output: result.stdout,
        error: result.error,
        testResults: testCases.map((tc, i) => ({
          testIndex: i,
          passed: false,
          input: tc.isHidden ? "[hidden]" : tc.input,
          expectedOutput: tc.isHidden ? "[hidden]" : tc.expectedOutput,
          actualOutput: result.error || "Execution failed",
          isHidden: tc.isHidden,
        })),
      };
    }

    // Parse the JSON output from the runner
    try {
      const parsed = JSON.parse(result.stdout.trim());
      const runnerResults: Array<{
        testIndex: number;
        passed: boolean;
        actualOutput: string;
        error?: boolean;
      }> = parsed.results || [];

      let passedCount = 0;
      const testResults: TestResult[] = testCases.map((tc, i) => {
        const r = runnerResults.find((rr) => rr.testIndex === i);
        const passed = r?.passed ?? false;
        if (passed) passedCount++;

        return {
          testIndex: i,
          passed,
          input: tc.isHidden ? "[hidden]" : tc.input,
          expectedOutput: tc.isHidden ? "[hidden]" : tc.expectedOutput,
          actualOutput: tc.isHidden ? (passed ? "[passed]" : "[failed]") : (r?.actualOutput ?? "No output"),
          isHidden: tc.isHidden,
        };
      });

      return {
        passed: passedCount === testCases.length,
        passedTests: passedCount,
        totalTests: testCases.length,
        executionTimeMs,
        output: result.stdout,
        error: null,
        testResults,
      };
    } catch {
      return {
        passed: false,
        passedTests: 0,
        totalTests: testCases.length,
        executionTimeMs,
        output: result.stdout,
        error: `Failed to parse test results. Raw output: ${result.stdout.slice(0, 500)}`,
        testResults: testCases.map((tc, i) => ({
          testIndex: i,
          passed: false,
          input: tc.isHidden ? "[hidden]" : tc.input,
          expectedOutput: tc.isHidden ? "[hidden]" : tc.expectedOutput,
          actualOutput: "Parse error",
          isHidden: tc.isHidden,
        })),
      };
    }
  } finally {
    // Clean up temp directory
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

function runPython(
  scriptPath: string,
  workDir: string,
  timeoutMs: number
): Promise<{ stdout: string; error: string | null }> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let killed = false;

    // Try python3 first, fall back to python
    const pythonBin = "python3";

    const proc = spawn(pythonBin, [scriptPath], {
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
          error: `Time Limit Exceeded: Your code did not complete within ${Math.round(timeoutMs / 1000)} seconds.`,
        });
        return;
      }

      if (code !== 0) {
        // Extract a clean error message from stderr
        const errorLines = stderr.trim().split("\n");
        const lastError = errorLines.slice(-3).join("\n");
        resolve({
          stdout,
          error: `Runtime Error (exit code ${code}):\n${lastError}`,
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

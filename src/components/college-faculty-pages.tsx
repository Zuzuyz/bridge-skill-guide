import { Loader2, UserMinus, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  assignStudent,
  getCollegeFaculty,
  getCollegeStudents,
  unassignStudent,
  type CollegeFacultyRow,
  type CollegeStudentRow,
} from "@/lib/college-admin-server";

/* =========================================================
   COLLEGE ADMIN — FACULTY & STUDENT ASSIGNMENT (UI)
   All data comes from college-admin-server.ts, which
   authorizes through the shared Phase 13 college resolver
   and scopes both faculty and students to the session
   college. Assignments are written only through those
   server-validated functions; the client never supplies a
   college id.
   ========================================================= */

function Loader() {
  return (
    <AppShell role="college">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-amber-200">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <span className="text-sm font-medium">Loading faculty data…</span>
        </div>
      </div>
    </AppShell>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

type FacultyState =
  | { kind: "loading" }
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | { kind: "no-college-profile" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      collegeName: string;
      faculty: CollegeFacultyRow[];
      students: CollegeStudentRow[];
    };

export function CollegeFacultyPage() {
  const [state, setState] = useState<FacultyState>({ kind: "loading" });
  const [selectedFacultyId, setSelectedFacultyId] = useState<string | null>(
    null,
  );
  const [busyStudentId, setBusyStudentId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setState({ kind: "loading" });
      try {
        const [facultyRes, studentsRes] = await Promise.all([
          getCollegeFaculty(),
          getCollegeStudents(),
        ]);

        if (!mounted) return;

        if (facultyRes.status !== "ok") {
          if (facultyRes.status === "unauthenticated") {
            setState({ kind: "unauthenticated" });
          } else if (facultyRes.status === "forbidden") {
            setState({ kind: "forbidden" });
          } else {
            setState({ kind: "no-college-profile" });
          }
          return;
        }
        if (studentsRes.status !== "ok") {
          setState({
            kind: "error",
            message: "Unable to load the student list for your college.",
          });
          return;
        }

        setState({
          kind: "ok",
          collegeName: facultyRes.college.name,
          faculty: facultyRes.faculty,
          students: studentsRes.students,
        });
      } catch (err) {
        if (mounted) {
          setState({
            kind: "error",
            message:
              err instanceof Error
                ? err.message
                : "Unable to load faculty data.",
          });
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const selectedFaculty =
    state.kind === "ok"
      ? (state.faculty.find((f) => f.id === selectedFacultyId) ?? null)
      : null;

  const assign = useCallback(
    async (studentProfileId: string) => {
      if (!selectedFacultyId) return;
      setBusyStudentId(studentProfileId);
      try {
        const result = await assignStudent({
          data: { studentProfileId, facultyProfileId: selectedFacultyId },
        });
        if (result.ok) {
          toast.success("Student assigned.");
          setReloadKey((key) => key + 1);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Assignment failed. Please try again.");
      } finally {
        setBusyStudentId(null);
      }
    },
    [selectedFacultyId],
  );

  const unassign = useCallback(async (studentProfileId: string) => {
    setBusyStudentId(studentProfileId);
    try {
      const result = await unassignStudent({ data: { studentProfileId } });
      if (result.ok) {
        toast.success("Student unassigned.");
        setReloadKey((key) => key + 1);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Unassignment failed. Please try again.");
    } finally {
      setBusyStudentId(null);
    }
  }, []);

  if (state.kind === "loading") {
    return <Loader />;
  }

  if (state.kind === "unauthenticated") {
    return (
      <AppShell role="college" title="Faculty & assignments">
        <Notice>Please log in with a college account to manage assignments.</Notice>
      </AppShell>
    );
  }

  if (state.kind === "forbidden") {
    return (
      <AppShell role="college" title="Faculty & assignments">
        <Notice>
          Only college and administrator accounts can manage student
          assignments.
        </Notice>
      </AppShell>
    );
  }

  if (state.kind === "no-college-profile") {
    return (
      <AppShell role="college" title="Faculty & assignments">
        <Notice>
          This account has no college profile yet, so there is no institution
          to manage assignments for.
        </Notice>
      </AppShell>
    );
  }

  if (state.kind === "error") {
    return (
      <AppShell role="college" title="Faculty & assignments">
        <Notice>{state.message}</Notice>
      </AppShell>
    );
  }

  const { collegeName, faculty, students } = state;

  return (
    <AppShell
      role="college"
      title="Faculty & assignments"
      eyebrow={collegeName}
    >
      {/* ---------------- FACULTY MEMBERS ---------------- */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">Faculty members</h2>
        {faculty.length === 0 ? (
          <Notice>
            No faculty members are registered for {collegeName} yet. Faculty
            accounts appear here once provisioned with this college.
          </Notice>
        ) : (
          <div className="space-y-2">
            {faculty.map((member) => {
              const selected = member.id === selectedFacultyId;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() =>
                    setSelectedFacultyId(selected ? null : member.id)
                  }
                  className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? "border-amber-400/50 bg-amber-400/10"
                      : "border-white/10 bg-card hover:bg-muted"
                  }`}
                >
                  <div>
                    <strong className="text-sm">{member.name}</strong>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {[member.title, member.department]
                        .filter(Boolean)
                        .join(" · ") || "Faculty"}
                    </span>
                  </div>
                  <Badge className="border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                    {member.studentCount} assigned student
                    {member.studentCount === 1 ? "" : "s"}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- STUDENTS IN COLLEGE ---------------- */}
      <section>
        <h2 className="mb-1 text-lg font-bold">Students</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          {selectedFaculty
            ? `Selecting assignments for ${selectedFaculty.name} — assign or unassign students below.`
            : "Select a faculty member above to assign or unassign students. Students work fully without an assignment."}
        </p>
        {students.length === 0 ? (
          <Notice>
            No students are currently linked to {collegeName} in the database.
          </Notice>
        ) : (
          <div className="space-y-2">
            {students.map((student) => {
              const busy = busyStudentId === student.id;
              const assignedToSelected =
                selectedFacultyId !== null &&
                student.assignedFaculty?.id === selectedFacultyId;
              return (
                <div
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-card p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{student.name}</strong>
                      {student.assignedFaculty ? (
                        <Badge className="border border-white/15 bg-white/5 text-slate-300">
                          → {student.assignedFaculty.name}
                        </Badge>
                      ) : (
                        <Badge className="border border-white/15 bg-white/5 text-muted-foreground">
                          Unassigned
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {student.primaryCareer ?? "Career target not set"}
                      {student.readiness != null
                        ? ` · readiness ${student.readiness}%`
                        : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {selectedFacultyId ? (
                      assignedToSelected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void unassign(student.id)}
                        >
                          {busy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <UserMinus className="size-4" />
                          )}
                          Unassign
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void assign(student.id)}
                        >
                          {busy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <UserPlus className="size-4" />
                          )}
                          Assign to {selectedFaculty?.name ?? "faculty"}
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {selectedFacultyId && students.length > 0 ? (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            Students remain fully usable while unassigned — an assignment only
            adds them to that faculty member's portal.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}

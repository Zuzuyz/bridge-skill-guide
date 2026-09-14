import { Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  Flame,
  GraduationCap,
  HelpCircle,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  getSkillDevelopmentData,
  getAssessmentDetails,
  submitAssessment,
  enrollProgram,
} from "@/lib/skill-development-server";

type TabType = "assess" | "map" | "grow";

export function SkillDevelopmentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("assess");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Assessment Runner State
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Category filter in assess tab
  const [assessFilter, setAssessFilter] = useState<string>("All");

  // Filter & Search in MAP skills inventory
  const [skillMapFilter, setSkillMapFilter] = useState<string>("All");
  const [skillMapSearch, setSkillMapSearch] = useState<string>("");

  // Enrollment feedback state
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState<string | null>(null);

  // Wallet copy feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getSkillDevelopmentData();
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load skill development data:", err);
      setError(err?.message || "Failed to load skill development data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer effect during active assessment
  useEffect(() => {
    if (!activeAssessmentId || testResult || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeAssessmentId, testResult, timeLeft]);

  const startAssessment = async (assessmentId: string) => {
    try {
      setLoadingAssessment(true);
      const details = await getAssessmentDetails({ data: assessmentId });
      setAssessmentData(details);
      setActiveAssessmentId(assessmentId);
      setCurrentQuestionIdx(0);
      setAnswers({});
      setTimeLeft(details.durationMinutes * 60);
      setTestResult(null);
    } catch (err: any) {
      console.error("Failed to start assessment:", err);
      alert("Could not load assessment: " + err.message);
    } finally {
      setLoadingAssessment(false);
    }
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleAutoSubmit = () => {
    if (!submittingTest && !testResult) {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (!assessmentData || !activeAssessmentId) return;

    try {
      setSubmittingTest(true);
      const totalTime = assessmentData.durationMinutes * 60;
      const timeSpentSeconds = Math.max(1, totalTime - timeLeft);

      const res = await submitAssessment({
        data: {
          assessmentId: activeAssessmentId,
          answers,
          timeSpentSeconds,
        },
      });

      setTestResult(res);
      // Refresh background data to update scores and wallet
      loadData();
    } catch (err: any) {
      console.error("Failed to submit assessment:", err);
      alert("Error submitting assessment: " + err.message);
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleEnroll = async (programId: string) => {
    try {
      setEnrollingId(programId);
      const res = await enrollProgram({ data: programId });
      setEnrollSuccessMsg(res.message);
      setTimeout(() => setEnrollSuccessMsg(null), 4000);
      loadData();
    } catch (err: any) {
      console.error("Enrollment failed:", err);
      alert("Enrollment failed: " + err.message);
    } finally {
      setEnrollingId(null);
    }
  };

  const copyCredential = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading && !data) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
          <p className="text-slate-300 font-light">Loading Skill Development Suite...</p>
        </div>
      </AppShell>
    );
  }

  const student = data?.student;
  const benchmarkComparison = data?.benchmarkComparison || [];
  const assessments = data?.assessments || [];
  const recommendedResources = data?.recommendedResources || [];
  const industryPrograms = data?.industryPrograms || [];
  const walletCredentials = data?.walletCredentials || [];
  const roadmap = data?.roadmap || [];
  const matchingOpportunities = data?.matchingOpportunities || [];

  const completedAssessmentsCount = assessments.filter((a: any) => a.isCompleted).length;
  const gapsMetCount = benchmarkComparison.filter((b: any) => b.status === "MET").length;

  const filteredAssessments = assessments.filter((a: any) => {
    if (assessFilter === "All") return true;
    if (assessFilter === "Technical") return a.category === "Technical";
    if (assessFilter === "Aptitude") return a.category === "Aptitude";
    if (assessFilter === "Soft Skills") return a.category === "Soft Skills";
    return true;
  });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        {/* =========================================================================
            HEADER & THREE-STAGE JOURNEY BANNER
        ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#0f0b21]/90 via-[#0a0718]/90 to-[#150d30]/90 p-6 md:p-8 backdrop-blur-2xl shadow-2xl shadow-amber-500/5">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md mb-3">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                FOUNDATIONAL SKILL DEVELOPMENT MODULE
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                Skill Development & Verification Hub
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300/80 max-w-2xl leading-relaxed">
                Connect your learning with industry benchmarks. Follow the continuous 3-stage loop:{" "}
                <span className="font-semibold text-amber-300">ASSESS</span> your verified proficiency,{" "}
                <span className="font-semibold text-cyan-300">MAP</span> your role benchmarks & wallet, and{" "}
                <span className="font-semibold text-emerald-300">GROW</span> with curated programs for guaranteed internship readiness.
              </p>
            </div>

            {/* Student Target Role & Readiness Pill */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/[0.04] border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="space-y-1">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">Target Role</div>
                <div className="text-sm font-bold text-white">{student?.targetRole || "Full-Stack Engineer"}</div>
                <div className="text-xs text-slate-400">College: {student?.college || "SkillBridge University"}</div>
              </div>
              <div className="h-10 w-px bg-white/10 hidden sm:block" />
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">Placement Readiness</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                  {student?.readiness || 70}%
                </div>
              </div>
            </div>
          </div>

          {/* Three-Stage Stepper Navigation Bar */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* STAGE 1: ASSESS */}
            <button
              onClick={() => {
                setActiveTab("assess");
                setActiveAssessmentId(null);
                setTestResult(null);
              }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                activeTab === "assess"
                  ? "bg-amber-500/15 border-amber-400/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30"
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    activeTab === "assess" ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30" : "bg-white/10 text-white"
                  }`}
                >
                  01
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    ASSESS
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {completedAssessmentsCount}/{assessments.length} Done
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">Adaptive tests & verified skill score</div>
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 ${activeTab === "assess" ? "text-amber-400" : "text-slate-500"}`} />
            </button>

            {/* STAGE 2: MAP */}
            <button
              onClick={() => {
                setActiveTab("map");
                setActiveAssessmentId(null);
                setTestResult(null);
              }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                activeTab === "map"
                  ? "bg-cyan-500/15 border-cyan-400/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30"
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    activeTab === "map" ? "bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30" : "bg-white/10 text-white"
                  }`}
                >
                  02
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    MAP
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                      {gapsMetCount}/{benchmarkComparison.length} Benchmarks
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">Role benchmarks & Skill Wallet</div>
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 ${activeTab === "map" ? "text-cyan-400" : "text-slate-500"}`} />
            </button>

            {/* STAGE 3: GROW */}
            <button
              onClick={() => {
                setActiveTab("grow");
                setActiveAssessmentId(null);
                setTestResult(null);
              }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                activeTab === "grow"
                  ? "bg-emerald-500/15 border-emerald-400/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/30"
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    activeTab === "grow" ? "bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/30" : "bg-white/10 text-white"
                  }`}
                >
                  03
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    GROW
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      {industryPrograms.length} Industry Programs
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">Personalized courses & Internships</div>
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 ${activeTab === "grow" ? "text-emerald-400" : "text-slate-500"}`} />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-red-200 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* =========================================================================
            STAGE 1: ASSESS TAB & IN-PAGE TEST RUNNER
        ========================================================================= */}
        {activeTab === "assess" && (
          <div className="space-y-8">
            {/* If Assessment Runner is Active */}
            {activeAssessmentId && assessmentData ? (
              <div className="rounded-3xl border border-amber-500/30 bg-[#0d091e]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-slate-100">
                {/* Result Modal View */}
                {testResult ? (
                  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-center max-w-xl mx-auto space-y-4">
                      <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 shadow-xl shadow-amber-500/10">
                        {testResult.passedBenchmark ? (
                          <Trophy className="h-14 w-14 text-amber-400 animate-bounce" />
                        ) : (
                          <Award className="h-14 w-14 text-amber-400" />
                        )}
                      </div>

                      <h2 className="text-3xl font-serif font-bold text-white">
                        {testResult.passedBenchmark ? "Assessment Passed & Verified!" : "Assessment Completed"}
                      </h2>

                      <p className="text-slate-300 text-sm">
                        You scored <span className="font-bold text-amber-300 text-lg">{testResult.score}%</span> (
                        {testResult.correctCount} of {testResult.totalCount} correct) in {assessmentData.title}.
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                          <ShieldCheck className="h-4 w-4 text-amber-400" />
                          Proficiency: {testResult.proficiency}
                        </span>
                        {testResult.verificationCode && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                            Verification: {testResult.verificationCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question Breakdown */}
                    <div className="space-y-4 mt-8">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-amber-400" />
                        Detailed Question Review & Explanations
                      </h3>

                      <div className="space-y-3">
                        {testResult.breakdown.map((item: any, idx: number) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              item.isCorrect
                                ? "bg-emerald-950/20 border-emerald-500/30"
                                : "bg-red-950/20 border-red-500/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                  <span>Question {idx + 1}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-amber-300/80">{item.topic || "Core Concept"}</span>
                                  <span className="text-slate-600">•</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      item.difficulty === "HARD"
                                        ? "bg-purple-500/20 text-purple-300"
                                        : item.difficulty === "MEDIUM"
                                        ? "bg-amber-500/20 text-amber-300"
                                        : "bg-emerald-500/20 text-emerald-300"
                                    }`}
                                  >
                                    {item.difficulty}
                                  </span>
                                </div>
                                <div className="text-sm font-semibold text-white">{item.question}</div>
                                <div className="text-xs space-y-1">
                                  <div className={item.isCorrect ? "text-emerald-300" : "text-red-300"}>
                                    Your Answer:{" "}
                                    {item.selectedOption >= 0 ? item.options[item.selectedOption] : "No answer selected"}
                                  </div>
                                  {!item.isCorrect && (
                                    <div className="text-emerald-400 font-medium">
                                      Correct Answer: {item.options[item.correctAnswer]}
                                    </div>
                                  )}
                                </div>
                                {item.explanation && (
                                  <div className="mt-2 text-xs text-slate-300/90 bg-black/30 p-2.5 rounded-xl border border-white/5">
                                    <span className="font-semibold text-amber-300">Explanation: </span>
                                    {item.explanation}
                                  </div>
                                )}
                              </div>
                              <div className="shrink-0">
                                {item.isCorrect ? (
                                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                ) : (
                                  <XCircle className="h-6 w-6 text-red-400" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-white/10">
                      <Button
                        onClick={() => {
                          setActiveAssessmentId(null);
                          setAssessmentData(null);
                          setTestResult(null);
                        }}
                        variant="outline"
                        className="border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-xl"
                      >
                        ← Back to Assessment List
                      </Button>

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => {
                            setActiveTab("map");
                            setActiveAssessmentId(null);
                            setTestResult(null);
                          }}
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl"
                        >
                          View in Skill Wallet
                        </Button>
                        <Button
                          onClick={() => {
                            setActiveTab("grow");
                            setActiveAssessmentId(null);
                            setTestResult(null);
                          }}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                        >
                          Continue to Learning Hub →
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Active Assessment In-Progress Test Runner */
                  <div className="space-y-6">
                    {/* Header Bar with Countdown & Progress */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
                      <div>
                        <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-2">
                          <span>{assessmentData.category} ASSESSMENT</span>
                          <span>•</span>
                          <span>{assessmentData.skillName}</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{assessmentData.title}</h2>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div
                          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-bold text-sm ${
                            timeLeft < 180
                              ? "bg-red-500/20 border-red-400 text-red-300 animate-pulse"
                              : "bg-amber-500/10 border-amber-400/30 text-amber-300"
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                          <span>{formatTimer(timeLeft)}</span>
                        </div>

                        <Button
                          onClick={() => {
                            if (confirm("Are you sure you want to cancel? Progress in this test will not be saved.")) {
                              setActiveAssessmentId(null);
                              setAssessmentData(null);
                            }
                          }}
                          variant="ghost"
                          className="text-slate-400 hover:text-white text-xs"
                        >
                          Exit Test
                        </Button>
                      </div>
                    </div>

                    {/* Question Jump Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {assessmentData.questions.map((q: any, idx: number) => {
                        const isAnswered = answers[q.id] !== undefined;
                        const isCurrent = idx === currentQuestionIdx;
                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIdx(idx)}
                            className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                              isCurrent
                                ? "bg-amber-400 text-slate-950 ring-2 ring-amber-400/50 scale-105"
                                : isAnswered
                                ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300"
                                : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>

                    {/* Current Question Body */}
                    {(() => {
                      const q = assessmentData.questions[currentQuestionIdx];
                      const selectedOption = answers[q.id];

                      return (
                        <div className="space-y-6 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                              Question {currentQuestionIdx + 1} of {assessmentData.questions.length}
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                                q.difficulty === "HARD"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                                  : q.difficulty === "MEDIUM"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                              }`}
                            >
                              Adaptive: {q.difficulty}
                            </span>
                          </div>

                          <div className="text-lg sm:text-xl font-medium text-white leading-relaxed">
                            {q.question}
                          </div>

                          {/* Options List */}
                          <div className="grid grid-cols-1 gap-3">
                            {q.options.map((opt: string, optIdx: number) => {
                              const isSelected = selectedOption === optIdx;
                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleSelectAnswer(q.id, optIdx)}
                                  className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                                    isSelected
                                      ? "bg-amber-500/20 border-amber-400/80 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/40"
                                      : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20 text-slate-200"
                                  }`}
                                >
                                  <div
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                                      isSelected ? "bg-amber-400 text-slate-950" : "bg-white/10 text-slate-300"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}
                                  </div>
                                  <div className="text-sm font-medium">{opt}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Navigation Footer */}
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                      <Button
                        onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                        disabled={currentQuestionIdx === 0}
                        variant="outline"
                        className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl disabled:opacity-30"
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-3">
                        {currentQuestionIdx < assessmentData.questions.length - 1 ? (
                          <Button
                            onClick={() =>
                              setCurrentQuestionIdx((prev) =>
                                Math.min(assessmentData.questions.length - 1, prev + 1)
                              )
                            }
                            className="bg-white/10 hover:bg-white/20 text-white rounded-xl"
                          >
                            Next Question →
                          </Button>
                        ) : null}

                        <Button
                          onClick={handleFinalSubmit}
                          disabled={submittingTest}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                        >
                          {submittingTest ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Evaluating...
                            </>
                          ) : (
                            "Submit Assessment"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Assessment Catalog View */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-white">SkillBridge Assessment Center</h2>
                    <p className="text-sm text-slate-300/80">
                      Take verified adaptive technical & aptitude benchmarks. Passing yields official credentials for your Skill Wallet.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/10">
                    {["All", "Technical", "Aptitude", "Soft Skills"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setAssessFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          assessFilter === cat
                            ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of Assessments */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssessments.map((assess: any) => {
                    const isCompleted = assess.isCompleted;
                    const passed = assess.passed;

                    return (
                      <div
                        key={assess.id}
                        className={`group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
                          isCompleted
                            ? passed
                              ? "bg-[#0b1419]/80 border-emerald-500/30 hover:border-emerald-400/50 shadow-lg shadow-emerald-500/5"
                              : "bg-[#180f15]/80 border-amber-500/30 hover:border-amber-400/50"
                            : "bg-[#0c0919]/85 border-white/10 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5"
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider ${
                                assess.category === "Technical"
                                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-400/20"
                                  : assess.category === "Aptitude"
                                  ? "bg-purple-500/10 text-purple-300 border border-purple-400/20"
                                  : "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20"
                              }`}
                            >
                              {assess.category}
                            </span>

                            {isCompleted ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  passed
                                    ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/30"
                                    : "bg-amber-400/10 text-amber-300 border border-amber-400/30"
                                }`}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                {assess.score}% Verified
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-slate-400">
                                Target: {assess.benchmarkScore}%
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                              {assess.title}
                            </h3>
                            <p className="mt-1.5 text-xs text-slate-300/80 leading-relaxed line-clamp-2">
                              {assess.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-amber-400" />
                              <span>{assess.durationMinutes} mins</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                              <span>{assess.totalQuestions} Questions</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10">
                          <Button
                            onClick={() => startAssessment(assess.id)}
                            disabled={loadingAssessment}
                            className={`w-full rounded-xl font-bold transition-all ${
                              isCompleted
                                ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                            }`}
                          >
                            {loadingAssessment && activeAssessmentId === assess.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {isCompleted ? "Retake Assessment" : "Start Assessment"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            STAGE 2: MAP TAB — ROLE BENCHMARKS & SKILL WALLET
        ========================================================================= */}
        {activeTab === "map" && (
          <div className="space-y-8">
            {/* Top Benchmark Summary Matrix */}
            <div className="rounded-3xl border border-cyan-500/20 bg-[#0c0919]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                    <Target className="h-4 w-4 text-cyan-400" />
                    Target Role Standard Analysis
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white">
                    Industry Benchmark Gap Matrix: {student?.targetRole || "Full-Stack Engineer"}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Met Benchmark ({gapsMetCount})
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-400/20">
                    <Zap className="h-3.5 w-3.5 text-amber-400" /> Near Target
                  </div>
                </div>
              </div>

              {/* Benchmarks Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-200">
                  <thead className="bg-white/[0.04] text-xs font-mono uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Required Competency</th>
                      <th className="py-3 px-4">Tier / Priority</th>
                      <th className="py-3 px-4">Industry Target</th>
                      <th className="py-3 px-4">Your Verified Level</th>
                      <th className="py-3 px-4">Status & Gap</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {benchmarkComparison.map((item: any) => {
                      const isMet = item.status === "MET";
                      const isNear = item.status === "NEAR";

                      return (
                        <tr key={item.skill} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                            <span>{item.skill}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                item.importance === "CRITICAL"
                                  ? "bg-red-500/20 text-red-300 border border-red-400/30"
                                  : item.importance === "CORE"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                                  : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                              }`}
                            >
                              {item.importance}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">{item.requiredScore}%</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isMet ? "bg-emerald-400" : isNear ? "bg-amber-400" : "bg-red-400"
                                  }`}
                                  style={{ width: `${Math.min(100, item.currentScore)}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs">{item.currentScore}%</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {isMet ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Met (Ready)
                              </span>
                            ) : isNear ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                                <Zap className="h-3.5 w-3.5" /> Gap: {item.gap}%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400">
                                <XCircle className="h-3.5 w-3.5" /> Gap: {item.gap}%
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isMet ? (
                              <span className="text-xs text-emerald-400/80 font-mono">✓ Verified</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveTab("assess");
                                }}
                                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                              >
                                Take Assessment →
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Extracted & Verified Skills Inventory */}
            <div className="rounded-3xl border border-white/10 bg-[#0c0919]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 uppercase tracking-wider mb-1">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Complete Profile Competencies ({data?.skills?.length || 0})
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white">Extracted & Verified Skills Inventory</h2>
                  <p className="text-sm text-slate-300/80 mt-1">
                    All technical skills parsed from your resume and proven through verified assessments.
                  </p>
                </div>

                {/* Filter and Search */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/10">
                    {["All", "AI / ML", "Development", "Databases", "Cloud & Tools", "Core CS"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSkillMapFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          skillMapFilter === cat
                            ? "bg-amber-400 text-slate-950 font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search skills..."
                      value={skillMapSearch}
                      onChange={(e) => setSkillMapSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
                    />
                  </div>
                </div>
              </div>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data?.skills || [])
                  .filter((s: any) => {
                    const matchesCat = skillMapFilter === "All" || (s.category && s.category.toLowerCase() === skillMapFilter.toLowerCase());
                    const matchesSearch = !skillMapSearch.trim() || s.name.toLowerCase().includes(skillMapSearch.toLowerCase().trim());
                    return matchesCat && matchesSearch;
                  })
                  .map((skill: any) => (
                    <div
                      key={skill.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-semibold text-white">{skill.name}</span>
                            {skill.category && (
                              <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                                {skill.category}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-amber-300 font-mono">{skill.score}%</span>
                        </div>

                        <div className="mt-2.5 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              skill.isVerified ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                            style={{ width: `${Math.min(100, skill.score)}%` }}
                          />
                        </div>

                        {skill.evidence && (
                          <p className="mt-2 text-[11px] text-slate-300/80 bg-black/30 p-2 rounded-xl border border-white/5 line-clamp-2">
                            {skill.evidence}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                        {skill.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> Verified Assessment
                          </span>
                        ) : (
                          <span className="text-slate-400">Resume Derived</span>
                        )}
                        <span className="text-slate-500">Confidence: {skill.confidence ?? 88}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* My Skill Wallet (Credentials & Badges) */}
            <div className="rounded-3xl border border-amber-500/20 bg-[#0c0919]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 uppercase tracking-wider mb-1">
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    Verified On-Chain Digital Credentials
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white">My Skill Wallet & Badges</h2>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  {walletCredentials.length} Verifiable Credentials Issued
                </div>
              </div>

              {/* Wallet Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {walletCredentials.map((cred: any) => (
                  <div
                    key={cred.id}
                    className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#120e26] to-[#090615] p-6 backdrop-blur-xl shadow-xl shadow-amber-500/5 group hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                          {cred.type === "BADGE" ? <Trophy className="h-5 w-5" /> : <Award className="h-5 w-5" />}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 uppercase">
                          {cred.type}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                          {cred.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Issued by: {cred.issuer}</p>
                      </div>

                      <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 font-mono text-xs">
                        <div className="text-slate-400 text-[10px] uppercase">Verification ID:</div>
                        <div className="flex items-center justify-between gap-2 text-amber-300 font-bold">
                          <span className="truncate">{cred.verificationCode}</span>
                          <button
                            onClick={() => copyCredential(cred.verificationCode)}
                            className="text-[11px] text-slate-400 hover:text-white underline shrink-0"
                          >
                            {copiedCode === cred.verificationCode ? "Copied! ✓" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Score: {cred.score}%</span>
                      <span>{new Date(cred.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STAGE 3: GROW TAB — GAP-DRIVEN LEARNING, INDUSTRY COHORTS & ROADMAP
        ========================================================================= */}
        {activeTab === "grow" && (
          <div className="space-y-8">
            {/* Success toast for enrollment */}
            {enrollSuccessMsg && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-4 text-emerald-200 flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-sm font-medium">{enrollSuccessMsg}</span>
              </div>
            )}

            {/* Gap-Driven Personalized Learning Hub */}
            <div className="rounded-3xl border border-emerald-500/20 bg-[#0c0919]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    Gap-Driven Curated Curriculum
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white">Personalized Learning Recommendations</h2>
                  <p className="text-sm text-slate-300/80 mt-1">
                    Courses and masterclasses handpicked to resolve your identified benchmark skill gaps.
                  </p>
                </div>
              </div>

              {/* Learning Resource Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedResources.map((res: any) => (
                  <div
                    key={res.id}
                    className={`rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
                      res.isPriority
                        ? "bg-[#0b1717]/90 border-emerald-500/40 shadow-lg shadow-emerald-500/10 hover:border-emerald-400"
                        : "bg-[#0c0919]/85 border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-white/10 text-slate-200 border border-white/10">
                          {res.skill}
                        </span>

                        {res.isPriority && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                            <Flame className="h-3 w-3 text-emerald-400" />
                            Priority Gap
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white leading-snug">{res.title}</h3>
                        <p className="mt-1 text-xs text-slate-400">Provider: {res.provider}</p>
                        <p className="mt-2 text-xs text-slate-300/80 leading-relaxed line-clamp-3">
                          {res.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-white/5">
                        <span>{res.duration}</span>
                        <span>•</span>
                        <span>{res.difficulty}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-colors"
                      >
                        Start Learning <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Learning Programs (Google, Microsoft, TCS iON, Amazon) */}
            <div className="rounded-3xl border border-amber-500/20 bg-[#0c0919]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-300 uppercase tracking-wider mb-1">
                    <Building2 className="h-4 w-4 text-amber-400" />
                    Corporate & Enterprise Cohorts
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white">Industry Learning & Placement Programs</h2>
                  <p className="text-sm text-slate-300/80 mt-1">
                    Enterprise programs designed directly by hiring partners to prepare you for immediate placement.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {industryPrograms.map((prog: any) => (
                  <div
                    key={prog.id}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#120d2b] to-[#0a0718] p-6 backdrop-blur-xl shadow-xl hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                          {prog.company}
                        </div>
                        {prog.isEnrolled ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Enrolled Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-slate-300">
                            {prog.duration}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-white">{prog.title}</h3>
                        <p className="mt-2 text-xs text-slate-300/80 leading-relaxed">{prog.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {prog.skills.map((s: string) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-white/5 text-slate-300 border border-white/5"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-400 font-mono">Eligibility: {prog.eligibility}</span>

                      {prog.isEnrolled ? (
                        <a
                          href={prog.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-bold transition-all"
                        >
                          Access Cohort <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Button
                          onClick={() => handleEnroll(prog.id)}
                          disabled={enrollingId === prog.id}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20"
                        >
                          {enrollingId === prog.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                          ) : null}
                          Enroll in Program
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Role Matching Internships for Readiness */}
            <div className="rounded-3xl border border-cyan-500/20 bg-[#0c0919]/85 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-300 uppercase tracking-wider mb-1">
                    <GraduationCap className="h-4 w-4 text-cyan-400" />
                    Internship & Placement Pipeline
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white">Recommended Internship Matches</h2>
                  <p className="text-sm text-slate-300/80 mt-1">
                    Direct opportunities aligned with your verified competencies.
                  </p>
                </div>

                <Link
                  to="/internships"
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
                >
                  Explore All Internships →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {matchingOpportunities.map((opp: any) => (
                  <div
                    key={opp.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl flex flex-col justify-between hover:border-cyan-400/40 transition-all duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">{opp.company}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                          {opp.matchScore}% Match
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white">{opp.role}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {opp.location}
                          </span>
                          <span>•</span>
                          <span>{opp.stipend}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {opp.requiredSkills.map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/10">
                      <Link
                        to="/internships"
                        className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/30 transition-colors"
                      >
                        Apply for Internship
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useAnalysis } from "@/hooks/useAnalysis";
import api from "@/lib/axios";
import { formatDate, getScoreColor, getStrengthColor, cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ScoreGauge = dynamic(() => import("@/components/ScoreGauge"), { ssr: false, loading: () => <div className="h-32 w-32 animate-pulse rounded-full bg-secondary/30" /> });
import {
    ArrowLeft, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
    Loader2, Download, FileText, Briefcase, AlertTriangle, Search,
    MessageSquare, BookOpen, ChevronRight,
} from "lucide-react";

interface ResumeDetail {
    id: string;
    original_name: string;
    file_type: string;
    file_size: number;
    status: string;
    uploaded_at: string;
    download_url?: string;
    error_message?: string;
}

interface Analysis {
    ats_score: number;
    quality_score: number;
    strength: string;
    extracted_skills: string[];
    grammar_issues: Array<{
        rule_id: string;
        message: string;
        context: string;
        suggestions: string[];
        severity: string;
    }>;
    sections_detected: string[];
    word_count: number;
    insights: string[];
    role_prediction?: { role: string; confidence: string; alternatives: string[] };
    anomalies?: string[];
}



// ── Grammar issue accordion ───────────────────────────────────
function GrammarIssue({ issue }: { issue: Analysis["grammar_issues"][0] }) {
    const [open, setOpen] = useState(false);
    const severityColor = {
        error: "border-red-500/30 bg-red-500/5",
        warning: "border-yellow-500/30 bg-yellow-500/5",
        suggestion: "border-blue-500/30 bg-blue-500/5",
    }[issue.severity] ?? "border-border bg-accent";

    return (
        <div className={`rounded-lg border p-3 text-sm transition-all ${severityColor}`}>
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-start justify-between gap-2 text-left"
            >
                <span className="font-medium text-foreground">{issue.message}</span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {open && (
                <div className="mt-2 space-y-1 text-muted-foreground animate-fade-in">
                    <p className="text-xs">
                        <span className="font-medium text-foreground">Context: </span>
                        <code className="rounded bg-secondary/50 px-1">{issue.context}</code>
                    </p>
                    {issue.suggestions.length > 0 && (
                        <p className="text-xs">
                            <span className="font-medium text-foreground">Suggestions: </span>
                            {issue.suggestions.join(", ")}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────
export default function ResumeDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const resumeId = params?.id as string;

    const [resume, setResume] = useState<ResumeDetail | null>(null);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [loadingPage, setLoadingPage] = useState(true);

    // ── Keyword Scanner ───────────────────────────────────────────
    const [kwInput, setKwInput] = useState("");
    const [kwResult, setKwResult] = useState<{
        total: number; matched_count: number; missing_count: number;
        coverage_pct: number; matched: string[]; missing: string[];
    } | null>(null);
    const [kwLoading, setKwLoading] = useState(false);
    const [kwError, setKwError] = useState("");

    // ── Interview Prep ────────────────────────────────────────────
    const [interviewData, setInterviewData] = useState<{
        behavioral: string[];
        technical: { easy: string[]; medium: string[]; hard: string[] };
        role_specific: string[];
        total: number;
    } | null>(null);
    const [interviewLoading, setInterviewLoading] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>(null);

    const handleKeywordScan = async () => {
        const keywords = kwInput.split(/[,\n]+/).map((k: string) => k.trim()).filter(Boolean);
        if (keywords.length === 0) return;
        setKwLoading(true);
        setKwError("");
        try {
            const res = await api.post(`/api/resumes/${resumeId}/keyword-scan`, { keywords });
            setKwResult(res.data);
        } catch {
            setKwError("Could not run keyword scan. Make sure the resume has been analyzed.");
        } finally { setKwLoading(false); }
    };

    const handleInterviewQuestions = async () => {
        if (interviewData) { setInterviewData(null); return; }
        setInterviewLoading(true);
        try {
            const res = await api.get(`/api/resumes/${resumeId}/interview-questions`);
            setInterviewData(res.data);
        } catch {/**/ } finally { setInterviewLoading(false); }
    };


    const { data: polled } = useAnalysis(
        resume?.status && !["done", "error"].includes(resume.status) ? resumeId : null
    );

    useEffect(() => {
        if (!authLoading && !user) router.replace("/");
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || !resumeId) return;
        api.get<{ resume: ResumeDetail; analysis: Analysis | null }>(`/api/resumes/${resumeId}`)
            .then((r) => {
                setResume(r.data.resume);
                if (r.data.analysis) setAnalysis(r.data.analysis);
            })
            .finally(() => setLoadingPage(false));
    }, [user, resumeId]);

    // Refresh when polling detects completion
    useEffect(() => {
        if (polled?.status === "done" && resume?.status !== "done") {
            api.get<{ resume: ResumeDetail; analysis: Analysis | null }>(`/api/resumes/${resumeId}`)
                .then((r) => {
                    setResume(r.data.resume);
                    if (r.data.analysis) setAnalysis(r.data.analysis);
                });
        }
    }, [polled?.status]);

    if (authLoading || loadingPage) {
        return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (!resume) return null;

    const isPending = ["pending", "processing"].includes(resume.status);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-5xl px-6 py-8">
                {/* Back */}
                <Link href="/resumes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft size={15} /> Back to Resumes
                </Link>

                {/* Resume header */}
                <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-sm font-bold uppercase text-primary">
                                {resume.file_type}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">{resume.original_name}</h1>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Uploaded {formatDate(resume.uploaded_at)}
                                    {analysis?.word_count ? ` · ${analysis.word_count} words` : ""}
                                </p>
                                {analysis?.role_prediction && (
                                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-400">
                                        <Briefcase size={12} /> {analysis.role_prediction.role}
                                    </div>
                                )}
                            </div>
                        </div>
                        {resume.download_url && (
                            <a
                                href={resume.download_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <Download size={14} /> Download
                            </a>
                        )}
                    </div>
                </div>

                {/* Pending state */}
                {isPending && (
                    <div className="glass rounded-2xl p-12 text-center animate-fade-in mb-6">
                        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
                        <p className="font-semibold text-foreground">AI Analysis in Progress</p>
                        <p className="mt-1 text-sm text-muted-foreground">This usually takes 15–30 seconds. Page updates automatically.</p>
                    </div>
                )}

                {/* Error state */}
                {resume.status === "error" && (
                    <div className="glass rounded-2xl p-8 text-center border border-red-500/20 mb-6">
                        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
                        <p className="font-semibold text-foreground">Analysis Failed</p>
                        <p className="mt-1 text-sm text-red-400">{resume.error_message || "Unknown error"}</p>
                    </div>
                )}

                {/* Analysis results */}
                {analysis && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Anomalies */}
                        {analysis.anomalies && analysis.anomalies.length > 0 && (
                            <div className="glass rounded-2xl p-5 border border-amber-500/30 bg-amber-500/5 mb-6">
                                <h2 className="text-sm font-semibold text-amber-500 mb-2 flex items-center gap-2">
                                    <AlertTriangle size={16} /> Potential Issues Detected
                                </h2>
                                <ul className="list-disc list-inside space-y-1 text-xs text-amber-500/80">
                                    {analysis.anomalies.map((anomaly, i) => (
                                        <li key={i}>{anomaly}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Score gauges */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-base font-semibold text-foreground mb-6">Score Overview</h2>
                            <div className="flex flex-wrap gap-8 justify-center md:justify-start">
                                <ScoreGauge score={analysis.ats_score} label="ATS Score" color="#60a5fa" />
                                <ScoreGauge score={analysis.quality_score} label="Quality Score" color="#34d399" />
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="text-3xl font-bold gradient-text capitalize">{analysis.strength}</div>
                                    <p className="text-xs text-muted-foreground">Overall Strength</p>
                                </div>
                            </div>
                        </div>

                        {/* Insights */}
                        {analysis.insights?.length > 0 && (
                            <div className="glass rounded-2xl p-6">
                                <h2 className="text-base font-semibold text-foreground mb-4">AI Insights</h2>
                                <ul className="space-y-2">
                                    {analysis.insights.map((insight, i) => (
                                        <li key={i} className="text-sm text-muted-foreground">{insight}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Sections detected */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-base font-semibold text-foreground mb-4">Sections Detected</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {["summary", "experience", "education", "skills", "projects", "certifications", "contact", "awards", "languages"].map((s) => {
                                    const found = (analysis.sections_detected || []).includes(s);
                                    return (
                                        <div key={s} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${found ? "bg-emerald-400/10 text-emerald-400" : "bg-secondary/30 text-muted-foreground/50"}`}>
                                            <CheckCircle size={13} className={found ? "opacity-100" : "opacity-30"} />
                                            <span className="capitalize">{s}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Skills */}
                        {analysis.extracted_skills?.length > 0 && (
                            <div className="glass rounded-2xl p-6">
                                <h2 className="text-base font-semibold text-foreground mb-4">
                                    Extracted Skills <span className="text-xs text-muted-foreground ml-1">({analysis.extracted_skills.length})</span>
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.extracted_skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Keyword Scanner ─────────────────────────── */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                                <Search size={16} className="text-primary" /> Keyword Scanner
                            </h2>
                            <p className="text-xs text-muted-foreground mb-4">Paste keywords from a job description (comma or newline separated) to see how many appear in this resume.</p>
                            <div className="flex gap-2">
                                <textarea
                                    value={kwInput}
                                    onChange={e => setKwInput(e.target.value)}
                                    placeholder="Python, React, AWS, REST API, CI/CD…"
                                    rows={2}
                                    className="flex-1 resize-none rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button
                                    onClick={handleKeywordScan}
                                    disabled={kwLoading}
                                    className="self-end flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:-translate-y-0.5 transition-transform disabled:opacity-50"
                                >
                                    {kwLoading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                                    Scan
                                </button>
                            </div>

                            {kwError && <p className="mt-2 text-xs text-destructive">{kwError}</p>}

                            {kwResult && (
                                <div className="mt-4 space-y-3">
                                    {/* Coverage bar */}
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">Coverage</span>
                                        <span className={`font-bold ${kwResult.coverage_pct >= 70 ? "text-emerald-400" : kwResult.coverage_pct >= 40 ? "text-amber-400" : "text-red-400"}`}>
                                            {kwResult.coverage_pct}% ({kwResult.matched_count}/{kwResult.total})
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${kwResult.coverage_pct}%`, background: kwResult.coverage_pct >= 70 ? "#34d399" : kwResult.coverage_pct >= 40 ? "#fbbf24" : "#f87171" }} />
                                    </div>
                                    {/* Chips */}
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {kwResult.matched.map(kw => (
                                            <span key={kw} className="flex items-center gap-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 text-[11px] text-emerald-400">
                                                <CheckCircle size={10} /> {kw}
                                            </span>
                                        ))}
                                        {kwResult.missing.map(kw => (
                                            <span key={kw} className="flex items-center gap-1 rounded-full bg-red-400/10 border border-red-400/20 px-2.5 py-1 text-[11px] text-red-400">
                                                <AlertCircle size={10} /> {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Interview Prep ──────────────────────────── */}
                        {analysis.extracted_skills?.length > 0 && (
                            <div className="glass rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        <MessageSquare size={16} className="text-primary" /> Interview Prep
                                    </h2>
                                    <button
                                        onClick={handleInterviewQuestions}
                                        disabled={interviewLoading}
                                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 px-3 py-2 text-xs font-semibold text-white hover:-translate-y-0.5 transition-transform disabled:opacity-50"
                                    >
                                        {interviewLoading ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
                                        {interviewData ? "Hide Questions" : "Generate Questions"}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">AI-generated interview questions based on your detected skills and predicted role.</p>

                                {interviewData && (
                                    <div className="space-y-2 mt-2">
                                        {[
                                            { key: "behavioral", label: "🧠 Behavioral", questions: interviewData.behavioral },
                                            { key: "easy", label: "✅ Technical — Easy", questions: interviewData.technical.easy },
                                            { key: "medium", label: "⚡ Technical — Medium", questions: interviewData.technical.medium },
                                            { key: "hard", label: "🔥 Technical — Hard", questions: interviewData.technical.hard },
                                            { key: "role", label: "🎯 Role-Specific", questions: interviewData.role_specific },
                                        ].filter(s => s.questions?.length > 0).map(section => (
                                            <div key={section.key} className="rounded-xl border border-border/50 overflow-hidden">
                                                <button
                                                    onClick={() => setOpenSection(openSection === section.key ? null : section.key)}
                                                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                                                >
                                                    <span>{section.label} <span className="text-muted-foreground text-xs">({section.questions?.length || 0})</span></span>
                                                    {openSection === section.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                                {openSection === section.key && (
                                                    <div className="px-4 pb-3 space-y-2">
                                                        {section.questions?.map((q, i) => (
                                                            <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                                                                <span className="text-primary flex-shrink-0 font-bold"><ChevronRight size={12} className="inline" /></span>
                                                                <p>{q}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Grammar issues ─────────────────────────── */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-base font-semibold text-foreground mb-1">
                                Grammar & Language
                            </h2>
                            <p className="text-xs text-muted-foreground mb-4">
                                {!analysis.grammar_issues || analysis.grammar_issues.length === 0
                                    ? "✅ No issues found"
                                    : `${analysis.grammar_issues.length} issue${analysis.grammar_issues.length !== 1 ? "s" : ""} detected`}
                            </p>
                            {analysis.grammar_issues?.length > 0 && (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                    {analysis.grammar_issues.map((issue, i) => (
                                        <GrammarIssue key={i} issue={issue} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useAnalysis } from "@/hooks/useAnalysis";
import api from "@/lib/axios";
import { formatDate, getScoreColor, getStrengthColor, cn } from "@/lib/utils";
import {
    RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
} from "recharts";
import {
    ArrowLeft, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
    Loader2, Download, FileText,
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
}

// ── Score Gauge (SVG circular progress) ──────────────────────
function ScoreGauge({
    score, label, color,
}: { score: number; label: string; color: string }) {
    const data = [{ value: score, fill: color }];
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative h-28 w-28">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%" cy="50%"
                        innerRadius="70%" outerRadius="100%"
                        startAngle={90} endAngle={-270}
                        data={data}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${color === "#34d399" ? "text-emerald-400" : "text-blue-400"}`}>
                        {score.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
    );
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

    // Poll until done
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
                                <p className="text-xs text-muted-foreground">
                                    Uploaded {formatDate(resume.uploaded_at)}
                                    {analysis?.word_count ? ` · ${analysis.word_count} words` : ""}
                                </p>
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
                        {analysis.insights.length > 0 && (
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
                                    const found = analysis.sections_detected.includes(s);
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
                        {analysis.extracted_skills.length > 0 && (
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

                        {/* Grammar issues */}
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-base font-semibold text-foreground mb-1">
                                Grammar & Language
                            </h2>
                            <p className="text-xs text-muted-foreground mb-4">
                                {analysis.grammar_issues.length === 0
                                    ? "✅ No issues found"
                                    : `${analysis.grammar_issues.length} issue${analysis.grammar_issues.length !== 1 ? "s" : ""} detected`}
                            </p>
                            {analysis.grammar_issues.length > 0 && (
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

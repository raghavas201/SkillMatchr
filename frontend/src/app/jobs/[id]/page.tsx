"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/axios";
import { formatDate, getScoreColor } from "@/lib/utils";
import dynamic from "next/dynamic";

const JobCharts = dynamic(() => import("@/components/JobCharts"), { ssr: false });
import {
    ArrowLeft, Briefcase, Loader2, Zap, Users,
    Target, AlertTriangle, CheckCircle, ChevronRight,
} from "lucide-react";

interface Job {
    id: string;
    title: string;
    company: string | null;
    content: string;
    created_at: string;
}

interface Match {
    id: string;
    resume_id: string;
    original_name: string;
    file_type: string;
    uploaded_at: string;
    similarity_score: number;
    hiring_probability: number;
    matched_keywords: string[] | string;
    skill_gaps: string[] | string;
    ats_score: number;
    quality_score: number;
    strength: string;
    rank: number;
    role_prediction?: any;
    anomalies?: string[] | string;
}

function ProbabilityBar({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color = pct >= 70 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-sm font-bold w-8 text-right" style={{ color }}>{pct}%</span>
        </div>
    );
}

const RADAR_COLORS = ["#60a5fa", "#34d399", "#a78bfa", "#fb923c", "#f472b6"];

export default function JobDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const jobId = params?.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [matching, setMatching] = useState(false);
    const [showJD, setShowJD] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/");
    }, [user, authLoading, router]);

    const fetchData = useCallback(async () => {
        if (!user || !jobId) return;
        try {
            const res = await api.get<{ job: Job; matches: Match[] }>(`/api/jobs/${jobId}`);
            setJob(res.data.job);
            setMatches(res.data.matches);
        } catch {/**/ } finally { setLoading(false); }
    }, [user, jobId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleMatch = async () => {
        setMatching(true);
        try {
            const res = await api.post<{ message: string }>(`/api/jobs/${jobId}/match`);
            alert(res.data.message);
            // Poll after a delay for results
            setTimeout(fetchData, 8000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Match failed";
            alert(msg);
        } finally { setMatching(false); }
    };

    const parseJSON = <T,>(val: T[] | string | null | undefined): T[] => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val as string); } catch { return []; }
    };

    if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!job) return null;

    // Recharts data
    const barData = matches.slice(0, 8).map((m) => ({
        name: m.original_name.replace(/\.(pdf|docx)$/i, "").substring(0, 15),
        probability: Math.round(m.hiring_probability * 100),
    }));

    const top3 = matches.slice(0, 3);
    const radarData = [
        { subject: "ATS", ...Object.fromEntries(top3.map((m, i) => [`c${i}`, m.ats_score ?? 0])) },
        { subject: "Quality", ...Object.fromEntries(top3.map((m, i) => [`c${i}`, m.quality_score ?? 0])) },
        { subject: "Similarity", ...Object.fromEntries(top3.map((m, i) => [`c${i}`, Math.round((m.similarity_score ?? 0) * 100)])) },
        { subject: "Hire Prob", ...Object.fromEntries(top3.map((m, i) => [`c${i}`, Math.round((m.hiring_probability ?? 0) * 100)])) },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-6xl px-6 py-8">
                {/* Back */}
                <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft size={15} /> Back to Jobs
                </Link>

                {/* Header */}
                <div className="glass rounded-2xl p-6 mb-6 animate-fade-in">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                                <Briefcase size={22} className="text-primary" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">{job.title}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {job.company && `${job.company} · `}
                                    Created {formatDate(job.created_at)} · {matches.length} candidate{matches.length !== 1 ? "s" : ""} matched
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowJD(!showJD)}
                                className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
                            >
                                {showJD ? "Hide JD" : "View JD"}
                            </button>
                            <button
                                onClick={handleMatch}
                                disabled={matching}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform disabled:opacity-50"
                            >
                                {matching ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                {matching ? "Matching…" : "Re-Match"}
                            </button>
                        </div>
                    </div>
                    {showJD && (
                        <div className="mt-4 rounded-xl bg-secondary/30 p-4 text-sm text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {job.content}
                        </div>
                    )}
                </div>

                {matches.length === 0 ? (
                    <div className="glass rounded-2xl py-20 text-center animate-fade-in">
                        <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No matches yet</p>
                        <p className="mt-1 text-xs text-muted-foreground/60">Click &quot;Re-Match&quot; to rank your analyzed resumes against this JD</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Charts row */}
                        <JobCharts
                            barData={barData}
                            radarData={radarData}
                            top3Names={top3.map((m) => m.original_name.replace(/\.(pdf|docx)$/i, ""))}
                        />

                        {/* Ranked candidates table */}
                        <div className="glass rounded-2xl p-6 animate-fade-in">
                            <h2 className="text-sm font-semibold text-foreground mb-4">Ranked Candidates</h2>
                            <div className="space-y-3">
                                {matches.map((m, i) => {
                                    const keywords = parseJSON<string>(m.matched_keywords);
                                    const gaps = parseJSON<string>(m.skill_gaps);
                                    const anomalies = parseJSON<string>(m.anomalies);
                                    const roleObj = m.role_prediction
                                        ? (typeof m.role_prediction === "string" ? parseJSON<any>(m.role_prediction) : m.role_prediction)
                                        : null;
                                    const roleStr = roleObj?.role ?? (typeof m.role_prediction === "string" ? m.role_prediction : null);
                                    return (
                                        <div key={m.resume_id}
                                            className="rounded-xl border border-border/50 bg-secondary/20 p-4 hover:bg-secondary/40 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Rank badge */}
                                                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${i === 0 ? "bg-yellow-400/20 text-yellow-400" : i === 1 ? "bg-gray-300/20 text-gray-300" : i === 2 ? "bg-amber-600/20 text-amber-600" : "bg-secondary text-muted-foreground"}`}>
                                                    #{m.rank}
                                                </div>

                                                {/* Name + meta */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                                        <div>
                                                            <p className="font-medium text-foreground">{m.original_name}</p>
                                                            <p className="text-xs text-muted-foreground">{formatDate(m.uploaded_at)}</p>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs">
                                                            {m.ats_score != null && (
                                                                <span className={`font-bold ${getScoreColor(Number(m.ats_score))}`}>ATS {Number(m.ats_score).toFixed(0)}%</span>
                                                            )}
                                                            {m.quality_score != null && (
                                                                <span className={`font-bold ${getScoreColor(Number(m.quality_score))}`}>Q {Number(m.quality_score).toFixed(0)}%</span>
                                                            )}
                                                            <Link href={`/resumes/${m.resume_id}`}
                                                                className="flex items-center gap-0.5 text-primary hover:underline"
                                                            >View <ChevronRight size={12} /></Link>
                                                        </div>
                                                    </div>

                                                    {/* Role prediction badge */}
                                                    {roleStr && roleStr !== "[]" && (
                                                        <div className="mt-2">
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                                                                <Briefcase size={10} /> {roleStr}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Anomalies */}
                                                    {anomalies.length > 0 && (
                                                        <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                                                            <p className="text-[10px] text-amber-500 font-semibold mb-1 flex items-center gap-1">
                                                                <AlertTriangle size={10} /> Potential Issues
                                                            </p>
                                                            <ul className="list-disc list-inside text-[10px] text-amber-500/80">
                                                                {anomalies.map((anomaly, idx) => (
                                                                    <li key={idx}>{anomaly}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Probability bar */}
                                                    <div className="mt-2">
                                                        <p className="text-[10px] text-muted-foreground mb-1">Hiring Probability</p>
                                                        <ProbabilityBar value={m.hiring_probability} />
                                                    </div>

                                                    {/* Keywords & gaps */}
                                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                                        {keywords.length > 0 && (
                                                            <div>
                                                                <p className="text-[10px] text-emerald-400 font-medium mb-1 flex items-center gap-1"><CheckCircle size={10} /> Matched</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {keywords.slice(0, 6).map((kw) => (
                                                                        <span key={kw} className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-400">{kw}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {gaps.length > 0 && (
                                                            <div>
                                                                <p className="text-[10px] text-amber-400 font-medium mb-1 flex items-center gap-1"><AlertTriangle size={10} /> Skill Gaps</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {gaps.slice(0, 6).map((gap) => (
                                                                        <span key={gap} className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-400">{gap}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

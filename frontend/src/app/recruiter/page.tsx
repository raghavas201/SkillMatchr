"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import JDModal from "@/components/JDModal";
import api from "@/lib/axios";
import { formatDate, getScoreColor } from "@/lib/utils";
import {
    Users, Briefcase, Loader2, Zap, Plus, ChevronRight, AlertTriangle,
    CheckCircle, Target, Filter, XCircle,
} from "lucide-react";

interface Job {
    id: string;
    title: string;
    company: string | null;
    content: string;
    match_count: number;
    created_at: string;
}

interface Match {
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

function ProbBar({ value }: { value: number }) {
    const pct = Math.round(value * 100);
    const color = pct >= 70 ? "#34d399" : pct >= 50 ? "#fbbf24" : "#f87171";
    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs font-bold w-8 text-right" style={{ color }}>{pct}%</span>
        </div>
    );
}

export default function RecruiterPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [matching, setMatching] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [minMatch, setMinMatch] = useState(0);
    const [filterSkill, setFilterSkill] = useState("");

    useEffect(() => {
        if (!authLoading && !user) router.replace("/");
    }, [user, authLoading, router]);

    const fetchJobs = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get<{ jobs: Job[] }>("/api/jobs");
            setJobs(res.data.jobs);
        } catch {/**/ } finally { setLoadingJobs(false); }
    }, [user]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const parseJSON = <T,>(val: T[] | string | null | undefined): T[] => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { return JSON.parse(val as string); } catch { return []; }
    };

    const fetchMatches = useCallback(async (jobId: string) => {
        setLoadingMatches(true);
        try {
            const res = await api.get<{ job: Job; matches: Match[] }>(`/api/jobs/${jobId}`);
            setMatches(res.data.matches);
        } catch {/**/ } finally { setLoadingMatches(false); }
    }, []);

    const handleSelectJob = (jobId: string) => {
        setSelectedJobId(jobId);
        setMatches([]);
        fetchMatches(jobId);
    };

    const handleMatch = async () => {
        if (!selectedJobId) return;
        setMatching(true);
        try {
            const res = await api.post<{ message: string }>(`/api/jobs/${selectedJobId}/match`);
            alert(res.data.message);
            setTimeout(() => fetchMatches(selectedJobId), 8000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Match failed";
            alert(msg);
        } finally { setMatching(false); }
    };

    if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!user) return null;

    // Filter matches
    const allSkills = Array.from(new Set(matches.flatMap(m => parseJSON<string>(m.matched_keywords).concat(parseJSON<string>(m.skill_gaps)))));
    const filteredMatches = matches.filter(m => {
        const prob = Math.round(m.hiring_probability * 100);
        if (prob < minMatch) return false;
        if (filterSkill) {
            const skills = parseJSON<string>(m.matched_keywords);
            if (!skills.some(s => s.toLowerCase().includes(filterSkill.toLowerCase()))) return false;
        }
        return true;
    });

    const selectedJob = jobs.find(j => j.id === selectedJobId);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            {showModal && (
                <JDModal onSuccess={() => { setShowModal(false); fetchJobs(); }} onClose={() => setShowModal(false)} />
            )}
            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between animate-slide-in">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Recruiter Mode</h1>
                        <p className="text-sm text-muted-foreground">Select a job description · rank all candidates</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-transform"
                    >
                        <Plus size={16} /> New Job Description
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
                    {/* Left: JD list */}
                    <div className="glass rounded-2xl p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Job Descriptions</p>
                        {loadingJobs ? (
                            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                        ) : jobs.length === 0 ? (
                            <div className="py-10 text-center">
                                <Briefcase className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                                <p className="text-xs text-muted-foreground">No job descriptions yet</p>
                                <button onClick={() => setShowModal(true)} className="mt-3 text-xs text-primary hover:underline">Create one</button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {jobs.map(job => (
                                    <button
                                        key={job.id}
                                        onClick={() => handleSelectJob(job.id)}
                                        className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${selectedJobId === job.id ? "bg-primary/10 border border-primary/30" : "hover:bg-accent/50"}`}
                                    >
                                        <p className="font-medium text-sm text-foreground truncate">{job.title}</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            {job.company && `${job.company} · `}{job.match_count} match{job.match_count !== 1 ? "es" : ""}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Candidate rankings */}
                    <div>
                        {!selectedJobId ? (
                            <div className="glass rounded-2xl py-24 text-center h-full flex flex-col items-center justify-center">
                                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                                <p className="text-sm font-medium text-muted-foreground">Select a job description to view ranked candidates</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Controls */}
                                <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
                                    <div className="flex-1 flex items-center gap-3 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <Filter size={13} className="text-muted-foreground" />
                                            <label className="text-xs text-muted-foreground">Min match:</label>
                                            <input
                                                type="range" min={0} max={100} step={5} value={minMatch}
                                                onChange={e => setMinMatch(Number(e.target.value))}
                                                className="w-24 accent-primary"
                                            />
                                            <span className="text-xs font-bold text-primary w-8">{minMatch}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Target size={13} className="text-muted-foreground" />
                                            <input
                                                type="text" placeholder="Filter by skill…" value={filterSkill}
                                                onChange={e => setFilterSkill(e.target.value)}
                                                className="rounded-lg border border-border bg-secondary/50 px-2 py-1 text-xs text-foreground w-36"
                                            />
                                            {filterSkill && (
                                                <button onClick={() => setFilterSkill("")} className="text-muted-foreground hover:text-foreground">
                                                    <XCircle size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleMatch}
                                        disabled={matching}
                                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:-translate-y-0.5 transition-transform disabled:opacity-50"
                                    >
                                        {matching ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                                        {matching ? "Matching…" : "Run Match"}
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: "Total Candidates", value: filteredMatches.length },
                                        { label: "Avg Probability", value: filteredMatches.length ? `${Math.round(filteredMatches.reduce((s, m) => s + m.hiring_probability, 0) / filteredMatches.length * 100)}%` : "—" },
                                        { label: "Strong Matches", value: filteredMatches.filter(m => m.hiring_probability >= 0.7).length },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="glass rounded-xl p-4">
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Candidate List */}
                                {loadingMatches ? (
                                    <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                ) : filteredMatches.length === 0 ? (
                                    <div className="glass rounded-2xl py-20 text-center">
                                        <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">
                                            {matches.length === 0 ? 'Click "Run Match" to rank candidates' : "No candidates match the current filters"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredMatches.map((m, i) => {
                                            const keywords = parseJSON<string>(m.matched_keywords);
                                            const gaps = parseJSON<string>(m.skill_gaps);
                                            const anomalies = parseJSON<string>(m.anomalies);
                                            const roleObj = m.role_prediction
                                                ? (typeof m.role_prediction === "string" ? parseJSON<any>(m.role_prediction) : m.role_prediction)
                                                : null;
                                            const roleStr = roleObj?.role ?? null;

                                            return (
                                                <div key={m.resume_id} className="glass rounded-xl p-4 hover:bg-accent/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                                                    <div className="flex items-start gap-3">
                                                        {/* Rank */}
                                                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? "bg-yellow-400/20 text-yellow-400" : i === 1 ? "bg-gray-300/20 text-gray-300" : i === 2 ? "bg-amber-600/20 text-amber-600" : "bg-secondary text-muted-foreground"}`}>
                                                            #{m.rank}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <div>
                                                                    <p className="font-medium text-foreground text-sm">{m.original_name}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        {m.ats_score !== undefined && <span className={`text-[10px] font-bold ${getScoreColor(m.ats_score)}`}>ATS {m.ats_score?.toFixed(0)}%</span>}
                                                                        {m.quality_score !== undefined && <span className={`text-[10px] font-bold ${getScoreColor(m.quality_score)}`}>Q {m.quality_score?.toFixed(0)}%</span>}
                                                                        {roleStr && <span className="inline-flex items-center gap-0.5 text-[10px] text-violet-400"><Briefcase size={9} />{roleStr}</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <ProbBar value={m.hiring_probability} />
                                                                    <Link href={`/resumes/${m.resume_id}`} className="flex items-center gap-0.5 text-xs text-primary hover:underline">
                                                                        View <ChevronRight size={11} />
                                                                    </Link>
                                                                </div>
                                                            </div>

                                                            {/* Anomalies */}
                                                            {anomalies.length > 0 && (
                                                                <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 flex items-start gap-1.5">
                                                                    <AlertTriangle size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                                                    <p className="text-[10px] text-amber-500">{anomalies[0]}{anomalies.length > 1 ? ` +${anomalies.length - 1} more` : ""}</p>
                                                                </div>
                                                            )}

                                                            {/* Keywords */}
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {keywords.slice(0, 5).map(kw => <span key={kw} className="rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-400 flex items-center gap-0.5"><CheckCircle size={8} />{kw}</span>)}
                                                                {gaps.slice(0, 3).map(g => <span key={g} className="rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-400 flex items-center gap-0.5"><AlertTriangle size={8} />{g}</span>)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

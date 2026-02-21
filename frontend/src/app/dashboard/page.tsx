"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ResumeUpload from "@/components/ResumeUpload";
import api, { saveToken } from "@/lib/axios";
import { formatDate, getStrengthColor, getScoreColor } from "@/lib/utils";
import dynamic from "next/dynamic";

// Recharts must NOT be imported at module level in Next.js — it accesses
// window/document and crashes during static pre-rendering even in "use client"
// pages. We lazy-load the chart section as a client-only component instead.
const ResumeChart = dynamic(() => import("@/components/ResumeChart"), { ssr: false });
import {
    FileText, TrendingUp, Award, CheckCircle, Clock,
    ArrowRight, UploadCloud, AlertCircle, Loader2, X,
} from "lucide-react";

interface Resume {
    id: string;
    original_name: string;
    file_type: string;
    status: string;
    uploaded_at: string;
    ats_score?: number;
    quality_score?: number;
    strength?: string;
}

function StatCard({ label, value, sub, icon: Icon, gradient }: {
    label: string; value: string | number; sub?: string;
    icon: React.ElementType; gradient: string;
}) {
    return (
        <div className="glass rounded-2xl p-6 animate-fade-in glow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
                    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const cfg = {
        done: { cls: "text-emerald-400 bg-emerald-400/10", Icon: CheckCircle },
        processing: { cls: "text-blue-400 bg-blue-400/10", Icon: Loader2 },
        pending: { cls: "text-yellow-400 bg-yellow-400/10", Icon: Clock },
        error: { cls: "text-red-400 bg-red-400/10", Icon: AlertCircle },
    } as const;
    const { cls, Icon } = cfg[status as keyof typeof cfg] ?? cfg.pending;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
            <Icon size={10} /> {status}
        </span>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading, refresh } = useAuth();
    const router = useRouter();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showUpload, setShowUpload] = useState(false);

    // ── Capture JWT token passed back from Google OAuth redirect ──
    useEffect(() => {
        if (typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (token) {
            saveToken(token);
            // Clean the token from the URL without adding a history entry
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, "", cleanUrl);
            // Re-fetch the authenticated user now that we have the token
            refresh();
        }
    }, [refresh]);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/");
    }, [user, authLoading, router]);

    const fetchResumes = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.get<{ resumes: Resume[] }>("/api/resumes");
            setResumes(res.data.resumes);
        } catch {/**/ } finally { setLoadingData(false); }
    }, [user]);

    useEffect(() => { fetchResumes(); }, [fetchResumes]);

    if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!user) return null;

    const analyzed = resumes.filter((r) => r.status === "done");
    const avgAts = analyzed.length ? Math.round(analyzed.reduce((s, r) => s + (r.ats_score ?? 0), 0) / analyzed.length) : 0;
    const avgQ = analyzed.length ? Math.round(analyzed.reduce((s, r) => s + (r.quality_score ?? 0), 0) / analyzed.length) : 0;

    // Build upload-over-time chart data (group by day)
    const byDay: Record<string, number> = {};
    resumes.forEach((r) => {
        const d = r.uploaded_at.slice(0, 10);
        byDay[d] = (byDay[d] ?? 0) + 1;
    });
    const chartData = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, count]) => ({ date: date.slice(5), count }));

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Welcome */}
                <div className="mb-8 flex items-center gap-4 animate-slide-in">
                    {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.name} width={56} height={56} className="rounded-2xl ring-2 ring-primary/30" />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold text-white">
                            {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.name.split(" ")[0]} 👋</h1>
                        <p className="text-sm text-muted-foreground">{user.email} · <span className="capitalize">{user.role}</span></p>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total Resumes" value={resumes.length} icon={FileText} gradient="from-blue-500 to-blue-600" />
                    <StatCard label="Avg ATS Score" value={avgAts > 0 ? `${avgAts}%` : "—"} sub="Applicant Tracking" icon={TrendingUp} gradient="from-violet-500 to-violet-600" />
                    <StatCard label="Avg Quality" value={avgQ > 0 ? `${avgQ}%` : "—"} sub="Overall quality" icon={Award} gradient="from-emerald-500 to-emerald-600" />
                    <StatCard label="Analyzed" value={`${analyzed.length} / ${resumes.length}`} sub="Completed analyses" icon={CheckCircle} gradient="from-cyan-500 to-cyan-600" />
                </div>

                {/* Upload modal */}
                {showUpload && (
                    <div className="mb-8 animate-fade-in relative">
                        <button onClick={() => setShowUpload(false)} className="absolute top-4 right-4 z-10 p-1 rounded-lg text-muted-foreground hover:text-foreground"><X size={16} /></button>
                        <ResumeUpload onSuccess={() => { setShowUpload(false); fetchResumes(); }} onClose={() => setShowUpload(false)} />
                    </div>
                )}

                {/* Upload CTA */}
                {!showUpload && (
                    <div className="mb-8 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center animate-fade-in">
                        <UploadCloud className="mx-auto mb-3 h-10 w-10 text-primary/60" />
                        <h3 className="text-base font-semibold text-foreground">Upload a Resume</h3>
                        <p className="mt-1 text-sm text-muted-foreground">PDF or DOCX · Up to 10 MB · Full AI analysis in seconds</p>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-transform"
                        >
                            Upload Resume <UploadCloud size={16} />
                        </button>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Upload timeline chart */}
                    {chartData.length > 1 && (
                        <div className="glass rounded-2xl p-6 lg:col-span-2">
                            <h2 className="text-sm font-semibold text-foreground mb-4">Upload Activity (last 14 days)</h2>
                            <ResumeChart data={chartData} />
                        </div>
                    )}

                    {/* Recent resumes */}
                    <div className={chartData.length > 1 ? "" : "lg:col-span-3"}>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-foreground">Recent Resumes</h2>
                            <Link href="/resumes" className="flex items-center gap-1 text-xs text-primary hover:underline">View all <ArrowRight size={12} /></Link>
                        </div>
                        {loadingData ? (
                            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                        ) : resumes.length === 0 ? (
                            <div className="glass rounded-xl py-10 text-center">
                                <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                                <p className="text-xs text-muted-foreground">No resumes yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {resumes.slice(0, 5).map((r, i) => (
                                    <Link key={r.id} href={`/resumes/${r.id}`}
                                        className="glass flex items-center justify-between rounded-xl px-4 py-3 hover:bg-accent/50 transition-colors animate-fade-in"
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-foreground truncate max-w-[180px]">{r.original_name}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(r.uploaded_at)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {r.ats_score != null && (
                                                <span className={`text-xs font-bold ${getScoreColor(Number(r.ats_score))}`}>{Number(r.ats_score).toFixed(0)}%</span>
                                            )}
                                            <StatusBadge status={r.status} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

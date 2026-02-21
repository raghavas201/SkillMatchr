"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/axios";
import dynamic from "next/dynamic";

// Lazy-load chart components to prevent recharts SSR crash
const ScoreHistoryChart = dynamic(
    () => import("@/components/AnalyticsCharts").then((m) => ({ default: m.ScoreHistoryChart })),
    { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-secondary/30 rounded-xl" /> }
);
const TopSkillsChart = dynamic(
    () => import("@/components/AnalyticsCharts").then((m) => ({ default: m.TopSkillsChart })),
    { ssr: false, loading: () => <div className="h-[220px] animate-pulse bg-secondary/30 rounded-xl" /> }
);
import {
    TrendingUp, Award, Briefcase, Loader2, BarChart2, Star, RefreshCw,
} from "lucide-react";

interface AnalyticsSummary {
    score_history: Array<{ date: string; avg_ats: number; avg_quality: number; count: number }>;
    averages: { avg_ats: number; avg_quality: number; total_analyzed: number };
    top_skills: Array<{ skill: string; count: number }>;
    top_roles: Array<{ role: string; count: number }>;
    jd_match_history: Array<{
        title: string; company: string | null;
        candidate_count: number; avg_similarity: number; avg_hire_prob: number;
        created_at: string;
    }>;
}

const SKILL_COLORS = ["#60a5fa", "#34d399", "#a78bfa", "#fb923c", "#f472b6", "#facc15"];

export default function AnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/");
    }, [user, authLoading, router]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await api.get<AnalyticsSummary>("/api/analytics/summary");
            setData(res.data);
        } catch {/**/ } finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!user) return null;

    const hasHistory = (data?.score_history?.length ?? 0) > 1;
    const topSkillsBar = (data?.top_skills ?? []).slice(0, 8).map(s => ({ name: s.skill, count: s.count }));

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between animate-slide-in">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                        <p className="text-sm text-muted-foreground">Your resume performance over time</p>
                    </div>
                    <button onClick={fetchData} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors">
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : !data ? (
                    <div className="glass rounded-2xl py-20 text-center">
                        <BarChart2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No analytics yet — upload and analyze some resumes first.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[
                                { label: "Avg ATS Score", value: `${data.averages.avg_ats ?? 0}%`, icon: TrendingUp, gradient: "from-blue-500 to-blue-600" },
                                { label: "Avg Quality Score", value: `${data.averages.avg_quality ?? 0}%`, icon: Award, gradient: "from-emerald-500 to-emerald-600" },
                                { label: "Resumes Analyzed", value: data.averages.total_analyzed, icon: Star, gradient: "from-violet-500 to-violet-600" },
                            ].map(({ label, value, icon: Icon, gradient }) => (
                                <div key={label} className="glass rounded-2xl p-6 animate-fade-in">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                                            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
                                        </div>
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                                            <Icon size={20} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Score History Chart */}
                        {hasHistory && (
                            <div className="glass rounded-2xl p-6 animate-fade-in">
                                <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-primary" /> Score History
                                </h2>
                                <ScoreHistoryChart data={data.score_history} />
                            </div>
                        )}

                        {/* Skills & Roles row */}
                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Top Skills */}
                            {topSkillsBar.length > 0 && (
                                <div className="glass rounded-2xl p-6 animate-fade-in">
                                    <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <Star size={14} className="text-primary" /> Top Skills Detected
                                    </h2>
                                    <TopSkillsChart data={topSkillsBar} />
                                </div>
                            )}

                            {/* Top Roles */}
                            {data.top_roles.length > 0 && (
                                <div className="glass rounded-2xl p-6 animate-fade-in">
                                    <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <Briefcase size={14} className="text-primary" /> Top Predicted Roles
                                    </h2>
                                    <div className="space-y-3">
                                        {data.top_roles.map(({ role, count }, i) => {
                                            const pct = Math.round((count / Math.max(...data.top_roles.map(r => r.count))) * 100);
                                            return (
                                                <div key={role}>
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-foreground font-medium capitalize">{role}</span>
                                                        <span className="text-muted-foreground">{count} resume{count !== 1 ? "s" : ""}</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: SKILL_COLORS[i % SKILL_COLORS.length] }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* JD Match History */}
                        {data.jd_match_history.length > 0 && (
                            <div className="glass rounded-2xl p-6 animate-fade-in">
                                <h2 className="text-sm font-semibold text-foreground mb-4">JD Match History</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-muted-foreground border-b border-border">
                                                <th className="pb-2 text-left font-medium">Job Title</th>
                                                <th className="pb-2 text-left font-medium">Company</th>
                                                <th className="pb-2 text-right font-medium">Candidates</th>
                                                <th className="pb-2 text-right font-medium">Avg Similarity</th>
                                                <th className="pb-2 text-right font-medium">Avg Hire Prob</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {data.jd_match_history.map((jd, i) => (
                                                <tr key={i} className="hover:bg-accent/20 transition-colors">
                                                    <td className="py-2.5 font-medium text-foreground">{jd.title}</td>
                                                    <td className="py-2.5 text-muted-foreground">{jd.company ?? "—"}</td>
                                                    <td className="py-2.5 text-right">{jd.candidate_count}</td>
                                                    <td className="py-2.5 text-right text-blue-400">{Math.round((jd.avg_similarity ?? 0) * 100)}%</td>
                                                    <td className="py-2.5 text-right text-emerald-400">{Math.round((jd.avg_hire_prob ?? 0) * 100)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Empty state when no score history or skills yet */}
                        {!hasHistory && data.top_skills.length === 0 && (
                            <div className="glass rounded-2xl py-16 text-center">
                                <BarChart2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">Analyze more resumes to see trends here.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

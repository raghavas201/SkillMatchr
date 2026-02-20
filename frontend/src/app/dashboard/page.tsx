"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import api from "@/lib/axios";
import { formatDate, getStrengthColor, getScoreColor } from "@/lib/utils";
import {
    FileText,
    TrendingUp,
    Award,
    Clock,
    ArrowRight,
    UploadCloud,
    CheckCircle,
    AlertCircle,
    Loader2,
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

interface DashboardStats {
    total: number;
    avgAts: number;
    avgQuality: number;
    done: number;
}

function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    iconColor,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    iconColor: string;
}) {
    return (
        <div className="glass rounded-2xl p-6 animate-fade-in glow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
                    {sub && (
                        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                    )}
                </div>
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColor}`}
                >
                    <Icon size={20} className="text-white" />
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
        done: { label: "Analyzed", cls: "text-emerald-400 bg-emerald-400/10", Icon: CheckCircle },
        processing: { label: "Processing", cls: "text-blue-400 bg-blue-400/10", Icon: Loader2 },
        pending: { label: "Pending", cls: "text-yellow-400 bg-yellow-400/10", Icon: Clock },
        error: { label: "Error", cls: "text-red-400 bg-red-400/10", Icon: AlertCircle },
    };
    const { label, cls, Icon } = config[status] ?? config.pending;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
            <Icon size={11} />
            {label}
        </span>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace("/");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        api
            .get<{ resumes: Resume[] }>("/api/resumes")
            .then((r) => setResumes(r.data.resumes))
            .catch(console.error)
            .finally(() => setLoadingData(false));
    }, [user]);

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const stats: DashboardStats = {
        total: resumes.length,
        avgAts:
            resumes.filter((r) => r.ats_score).length > 0
                ? Math.round(
                    resumes.reduce((s, r) => s + (r.ats_score ?? 0), 0) /
                    resumes.filter((r) => r.ats_score).length
                )
                : 0,
        avgQuality:
            resumes.filter((r) => r.quality_score).length > 0
                ? Math.round(
                    resumes.reduce((s, r) => s + (r.quality_score ?? 0), 0) /
                    resumes.filter((r) => r.quality_score).length
                )
                : 0,
        done: resumes.filter((r) => r.status === "done").length,
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Welcome header */}
                <div className="mb-8 flex items-center gap-4 animate-slide-in">
                    {user.avatar_url ? (
                        <Image
                            src={user.avatar_url}
                            alt={user.name}
                            width={56}
                            height={56}
                            className="rounded-2xl ring-2 ring-primary/30"
                        />
                    ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold text-white">
                            {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Welcome back, {user.name.split(" ")[0]} 👋
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {user.email} · <span className="capitalize">{user.role}</span>
                        </p>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Resumes"
                        value={stats.total}
                        icon={FileText}
                        iconColor="bg-gradient-to-br from-blue-500 to-blue-600"
                    />
                    <StatCard
                        label="Avg ATS Score"
                        value={stats.avgAts > 0 ? `${stats.avgAts}%` : "—"}
                        sub="Applicant Tracking System"
                        icon={TrendingUp}
                        iconColor="bg-gradient-to-br from-violet-500 to-violet-600"
                    />
                    <StatCard
                        label="Avg Quality"
                        value={stats.avgQuality > 0 ? `${stats.avgQuality}%` : "—"}
                        sub="Overall resume quality"
                        icon={Award}
                        iconColor="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        label="Analyzed"
                        value={`${stats.done} / ${stats.total}`}
                        sub="Completed analyses"
                        icon={CheckCircle}
                        iconColor="bg-gradient-to-br from-cyan-500 to-cyan-600"
                    />
                </div>

                {/* Upload CTA */}
                <div className="mb-8 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center animate-fade-in">
                    <UploadCloud className="mx-auto mb-3 h-10 w-10 text-primary/60" />
                    <h3 className="text-base font-semibold text-foreground">
                        Upload a Resume
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        PDF or DOCX · Up to 10 MB · Full AI analysis in seconds
                    </p>
                    <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30">
                        Upload Resume
                        <UploadCloud size={16} />
                    </button>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Full upload functionality available in Phase 2
                    </p>
                </div>

                {/* Resume list */}
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">
                            Recent Resumes
                        </h2>
                        {resumes.length > 0 && (
                            <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                                View all <ArrowRight size={14} />
                            </button>
                        )}
                    </div>

                    {loadingData ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : resumes.length === 0 ? (
                        <div className="glass rounded-2xl py-16 text-center animate-fade-in">
                            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                            <p className="text-sm font-medium text-muted-foreground">
                                No resumes uploaded yet
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground/60">
                                Upload your first resume to get an AI-powered analysis
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {resumes.slice(0, 5).map((resume, i) => (
                                <div
                                    key={resume.id}
                                    className="glass flex items-center justify-between rounded-xl px-5 py-4 transition-colors hover:bg-accent/50 animate-fade-in"
                                    style={{ animationDelay: `${i * 80}ms` }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-xs font-bold uppercase text-primary">
                                            {resume.file_type}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">
                                                {resume.original_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(resume.uploaded_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {resume.ats_score !== undefined && (
                                            <div className="hidden sm:block text-right">
                                                <p className={`text-sm font-bold ${getScoreColor(resume.ats_score)}`}>
                                                    {resume.ats_score.toFixed(0)}%
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">ATS</p>
                                            </div>
                                        )}
                                        {resume.strength && (
                                            <span className={`hidden sm:block text-xs font-medium capitalize ${getStrengthColor(resume.strength)}`}>
                                                {resume.strength}
                                            </span>
                                        )}
                                        <StatusBadge status={resume.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

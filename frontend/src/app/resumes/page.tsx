"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ResumeUpload from "@/components/ResumeUpload";
import api from "@/lib/axios";
import { formatDate, formatFileSize, getStrengthColor, getScoreColor } from "@/lib/utils";
import {
    FileText, Filter, SortAsc, Trash2, Eye,
    CheckCircle, AlertCircle, Clock, Loader2, UploadCloud, X,
} from "lucide-react";

interface Resume {
    id: string;
    original_name: string;
    file_type: string;
    file_size: number;
    status: string;
    uploaded_at: string;
    ats_score?: number;
    quality_score?: number;
    strength?: string;
}

const STATUS_TABS = ["all", "pending", "done", "error"] as const;

function StatusBadge({ status }: { status: string }) {
    const map = {
        done: { label: "Analyzed", cls: "text-emerald-400 bg-emerald-400/10", Icon: CheckCircle },
        processing: { label: "Processing", cls: "text-blue-400 bg-blue-400/10", Icon: Loader2 },
        pending: { label: "Pending", cls: "text-yellow-400 bg-yellow-400/10", Icon: Clock },
        error: { label: "Error", cls: "text-red-400 bg-red-400/10", Icon: AlertCircle },
    } as const;
    const { label, cls, Icon } = map[status as keyof typeof map] ?? map.pending;
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
            <Icon size={11} className={status === "processing" ? "animate-spin" : ""} />
            {label}
        </span>
    );
}

export default function ResumesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>("all");
    const [sort, setSort] = useState("date");
    const [showUpload, setShowUpload] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/");
    }, [user, authLoading, router]);

    const fetchResumes = async () => {
        try {
            const res = await api.get<{ resumes: Resume[] }>("/api/resumes", {
                params: { status: activeTab, sort },
            });
            setResumes(res.data.resumes);
        } catch {/**/ } finally { setLoading(false); }
    };

    useEffect(() => { if (user) fetchResumes(); }, [user, activeTab, sort]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this resume? This cannot be undone.")) return;
        setDeleting(id);
        try {
            await api.delete(`/api/resumes/${id}`);
            setResumes((prev) => prev.filter((r) => r.id !== id));
        } catch {/**/ } finally { setDeleting(null); }
    };

    if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between animate-slide-in">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">My Resumes</h1>
                        <p className="text-sm text-muted-foreground">{resumes.length} resume{resumes.length !== 1 ? "s" : ""} total</p>
                    </div>
                    <button
                        onClick={() => setShowUpload(!showUpload)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-transform"
                    >
                        {showUpload ? <X size={15} /> : <UploadCloud size={15} />}
                        {showUpload ? "Close" : "Upload Resume"}
                    </button>
                </div>

                {/* Upload panel */}
                {showUpload && (
                    <div className="mb-6 animate-fade-in">
                        <ResumeUpload
                            onSuccess={(r) => { setShowUpload(false); fetchResumes(); }}
                            onClose={() => setShowUpload(false)}
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${activeTab === tab
                                        ? "bg-primary text-primary-foreground shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="ats">Sort by ATS Score</option>
                        <option value="quality">Sort by Quality</option>
                    </select>
                </div>

                {/* Resume list */}
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : resumes.length === 0 ? (
                    <div className="glass rounded-2xl py-20 text-center animate-fade-in">
                        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No resumes found</p>
                        <p className="mt-1 text-xs text-muted-foreground/60">Upload your first resume to get started</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {resumes.map((resume, i) => (
                            <div
                                key={resume.id}
                                className="glass flex items-center gap-4 rounded-xl px-5 py-4 hover:bg-accent/40 transition-colors animate-fade-in"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                {/* File type badge */}
                                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-xs font-bold uppercase text-primary flex-shrink-0">
                                    {resume.file_type}
                                </div>

                                {/* Name + meta */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{resume.original_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(resume.uploaded_at)}
                                        {resume.file_size ? ` · ${formatFileSize(resume.file_size)}` : ""}
                                    </p>
                                </div>

                                {/* Scores */}
                                <div className="hidden md:flex items-center gap-4">
                                    {resume.ats_score !== undefined && (
                                        <div className="text-center">
                                            <p className={`text-sm font-bold ${getScoreColor(resume.ats_score)}`}>
                                                {resume.ats_score.toFixed(0)}%
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">ATS</p>
                                        </div>
                                    )}
                                    {resume.quality_score !== undefined && (
                                        <div className="text-center">
                                            <p className={`text-sm font-bold ${getScoreColor(resume.quality_score)}`}>
                                                {resume.quality_score.toFixed(0)}%
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">Quality</p>
                                        </div>
                                    )}
                                    {resume.strength && (
                                        <span className={`text-xs font-medium capitalize ${getStrengthColor(resume.strength)}`}>
                                            {resume.strength}
                                        </span>
                                    )}
                                </div>

                                <StatusBadge status={resume.status} />

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <Link
                                        href={`/resumes/${resume.id}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                    >
                                        <Eye size={15} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(resume.id)}
                                        disabled={deleting === resume.id}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    >
                                        {deleting === resume.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

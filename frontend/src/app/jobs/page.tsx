"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import JDModal from "@/components/JDModal";
import api from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import {
    Briefcase, Plus, Loader2, ChevronRight, Trash2,
    Zap, Users, CheckCircle,
} from "lucide-react";

interface Job {
    id: string;
    title: string;
    company: string | null;
    content: string;
    match_count: number;
    last_matched_at: string | null;
    created_at: string;
}

export default function JobsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [matching, setMatching] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.replace("/");
    }, [user, authLoading, router]);

    const fetchJobs = async () => {
        try {
            const res = await api.get<{ jobs: Job[] }>("/api/jobs");
            setJobs(res.data.jobs);
        } catch {/**/ } finally { setLoading(false); }
    };

    useEffect(() => { if (user) fetchJobs(); }, [user]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        if (!confirm("Delete this job description?")) return;
        setDeleting(id);
        try {
            await api.delete(`/api/jobs/${id}`);
            setJobs((prev) => prev.filter((j) => j.id !== id));
        } catch {/**/ } finally { setDeleting(null); }
    };

    const handleMatch = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        setMatching(id);
        try {
            const res = await api.post<{ message: string }>(`/api/jobs/${id}/match`);
            alert(res.data.message);
            fetchJobs();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Match failed";
            alert(msg);
        } finally { setMatching(null); }
    };

    if (authLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            {showModal && (
                <JDModal onSuccess={() => { setShowModal(false); fetchJobs(); }} onClose={() => setShowModal(false)} />
            )}
            <main className="mx-auto max-w-5xl px-6 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between animate-slide-in">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Job Matches</h1>
                        <p className="text-sm text-muted-foreground">{jobs.length} job description{jobs.length !== 1 ? "s" : ""}</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 transition-transform"
                    >
                        <Plus size={16} /> New Job Description
                    </button>
                </div>

                {/* Stats */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                    {[
                        { label: "Total JDs", value: jobs.length, icon: Briefcase, gradient: "from-blue-500 to-blue-600" },
                        { label: "Total Matches Run", value: jobs.reduce((s, j) => s + (j.match_count || 0), 0), icon: Users, gradient: "from-violet-500 to-violet-600" },
                        { label: "JDs with Results", value: jobs.filter(j => j.match_count > 0).length, icon: CheckCircle, gradient: "from-emerald-500 to-emerald-600" },
                    ].map(({ label, value, icon: Icon, gradient }) => (
                        <div key={label} className="glass rounded-2xl p-5 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                                    <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
                                </div>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                                    <Icon size={18} className="text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* JD list */}
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : jobs.length === 0 ? (
                    <div className="glass rounded-2xl py-20 text-center animate-fade-in">
                        <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No job descriptions yet</p>
                        <p className="mt-1 text-xs text-muted-foreground/60">Create a JD to start matching candidates</p>
                        <button onClick={() => setShowModal(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:-translate-y-0.5 transition-transform">
                            <Plus size={15} /> New Job Description
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {jobs.map((job, i) => (
                            <Link key={job.id} href={`/jobs/${job.id}`}
                                className="glass flex items-center gap-4 rounded-xl px-5 py-4 hover:bg-accent/50 transition-colors animate-fade-in group"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex-shrink-0">
                                    <Briefcase size={18} className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground truncate">{job.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {job.company && <span>{job.company} · </span>}
                                        Created {formatDate(job.created_at)}
                                        {job.match_count > 0 && <span className="ml-1 text-emerald-400 font-medium">· {job.match_count} matches</span>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleMatch(job.id, e)}
                                        disabled={matching === job.id}
                                        title="Match against all analyzed resumes"
                                        className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                    >
                                        {matching === job.id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                                        {matching === job.id ? "Matching…" : "Match"}
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(job.id, e)}
                                        disabled={deleting === job.id}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    >
                                        {deleting === job.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

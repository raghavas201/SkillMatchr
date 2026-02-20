"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { X, Briefcase, Loader2 } from "lucide-react";

interface Props {
    onSuccess: () => void;
    onClose: () => void;
}

export default function JDModal({ onSuccess, onClose }: Props) {
    const [title, setTitle] = useState("");
    const [company, setCompany] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim().length < 50) {
            setError("Job description must be at least 50 characters.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await api.post("/api/jobs", { title, company, content });
            onSuccess();
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create job description.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="glass rounded-2xl w-full max-w-2xl p-8 shadow-2xl glow animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Briefcase size={20} className="text-primary" />
                        <h2 className="text-lg font-bold text-foreground">New Job Description</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job Title *</label>
                            <input
                                required value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Senior Backend Engineer"
                                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Company</label>
                            <input
                                value={company} onChange={(e) => setCompany(e.target.value)}
                                placeholder="e.g. Acme Corp"
                                className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                            Job Description * <span className="text-muted-foreground/50">({content.length} chars)</span>
                        </label>
                        <textarea
                            required value={content} onChange={(e) => setContent(e.target.value)}
                            rows={10}
                            placeholder="Paste the full job description here — requirements, responsibilities, tech stack…"
                            className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm border border-border text-muted-foreground hover:bg-accent transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:-translate-y-0.5 transition-transform disabled:opacity-50">
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Briefcase size={14} />}
                            {loading ? "Creating…" : "Create JD"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

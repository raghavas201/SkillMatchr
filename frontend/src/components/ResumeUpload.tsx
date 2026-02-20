"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

interface UploadedResume {
    id: string;
    original_name: string;
    status: string;
}

interface Props {
    onSuccess?: (resume: UploadedResume) => void;
    onClose?: () => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export default function ResumeUpload({ onSuccess, onClose }: Props) {
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [uploadedFile, setUploadedFile] = useState<UploadedResume | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        const allowed = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowed.includes(file.type)) return "Only PDF and DOCX files are allowed";
        if (file.size > 10 * 1024 * 1024) return "File size must be under 10 MB";
        return null;
    };

    const doUpload = useCallback(async (file: File) => {
        const err = validateFile(file);
        if (err) {
            setErrorMsg(err);
            setUploadState("error");
            return;
        }

        setUploadState("uploading");
        setProgress(0);
        setErrorMsg("");

        const formData = new FormData();
        formData.append("resume", file);

        try {
            const res = await api.post<{ resume: UploadedResume }>("/api/resumes/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (ev) => {
                    if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
                },
            });
            setUploadedFile(res.data.resume);
            setUploadState("success");
            onSuccess?.(res.data.resume);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Upload failed. Please try again.";
            setErrorMsg(msg);
            setUploadState("error");
        }
    }, [onSuccess]);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) doUpload(file);
        },
        [doUpload]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) doUpload(file);
    };

    const reset = () => {
        setUploadState("idle");
        setProgress(0);
        setErrorMsg("");
        setUploadedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="relative glass rounded-2xl p-8">
            {/* Close button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                    <X size={18} />
                </button>
            )}

            <h3 className="text-lg font-semibold text-foreground mb-1">Upload Resume</h3>
            <p className="text-xs text-muted-foreground mb-6">PDF or DOCX · Max 10 MB</p>

            {/* Drop zone */}
            {uploadState === "idle" && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200",
                        dragOver
                            ? "border-primary bg-primary/10 scale-[1.01]"
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                    )}
                >
                    <UploadCloud className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">
                        Drag &amp; drop your resume here
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">or click to browse files</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            )}

            {/* Uploading */}
            {uploadState === "uploading" && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground">Uploading…</span>
                        <span className="ml-auto text-sm font-bold text-primary">{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        Hang on — AI analysis will begin automatically
                    </p>
                </div>
            )}

            {/* Success */}
            {uploadState === "success" && (
                <div className="text-center space-y-3">
                    <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
                    <p className="font-semibold text-foreground">Upload Successful!</p>
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{uploadedFile?.original_name}</span>{" "}
                        is being analyzed by AI. Check back in a moment.
                    </p>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={reset}
                            className="rounded-lg px-4 py-2 text-sm border border-border text-muted-foreground hover:bg-accent transition-colors"
                        >
                            Upload another
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="rounded-lg px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-violet-600 text-white font-medium hover:-translate-y-0.5 transition-transform"
                            >
                                Go to Dashboard
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Error */}
            {uploadState === "error" && (
                <div className="text-center space-y-3">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                    <p className="font-semibold text-foreground">Upload Failed</p>
                    <p className="text-sm text-red-400">{errorMsg}</p>
                    <button
                        onClick={reset}
                        className="rounded-lg px-4 py-2 text-sm border border-border text-muted-foreground hover:bg-accent transition-colors"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    );
}

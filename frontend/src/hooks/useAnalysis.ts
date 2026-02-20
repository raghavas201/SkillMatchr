"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/axios";

interface AnalysisStatus {
    id: string;
    status: "pending" | "processing" | "done" | "error";
    ats_score?: number;
    quality_score?: number;
    strength?: string;
    error_message?: string;
}

export function useAnalysis(resumeId: string | null, pollIntervalMs = 3000) {
    const [data, setData] = useState<AnalysisStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        if (!resumeId) return;

        setLoading(true);

        const poll = async () => {
            try {
                const res = await api.get<{ resume: AnalysisStatus }>(`/api/resumes/${resumeId}`);
                const resume = res.data.resume;
                setData(resume);

                if (resume.status === "done" || resume.status === "error") {
                    stopPolling();
                    setLoading(false);
                }
            } catch {
                stopPolling();
                setLoading(false);
            }
        };

        poll(); // immediate first call
        intervalRef.current = setInterval(poll, pollIntervalMs);

        return () => stopPolling();
    }, [resumeId, pollIntervalMs]);

    return { data, loading, stopPolling };
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

    const [oauthError, setOauthError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("error") === "oauth_failed") {
                setOauthError("Google sign-in failed. Please try again or check that Google OAuth credentials are configured.");
                window.history.replaceState({}, "", "/");
            }
        }
    }, []);

    useEffect(() => {
        if (!loading && user) {
            router.replace("/dashboard");
        }
    }, [user, loading, router]);

    return (
        <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background radial glows */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-600/5 blur-3xl" />
                {/* Animated grid */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                        backgroundSize: "64px 64px",
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <path
                                d="M8 28V10a2 2 0 012-2h10l8 8v12a2 2 0 01-2 2H10a2 2 0 01-2-2z"
                                fill="white"
                                fillOpacity="0.9"
                            />
                            <path d="M20 8v8h8" fill="white" fillOpacity="0.5" />
                            <path d="M12 20h12M12 24h8" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight gradient-text">
                        AI Resume Analyzer
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground text-center">
                        Intelligent hiring portal powered by NLP &amp; machine learning
                    </p>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl p-8 shadow-2xl glow">
                    <div className="mb-6 text-center">
                        <h2 className="text-xl font-semibold text-foreground">
                            Welcome back
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Sign in to analyze resumes and discover top talent
                        </p>
                    </div>

                    {/* Features */}
                    <ul className="mb-8 space-y-2">
                        {[
                            "🎯 ATS score & quality analysis",
                            "🧠 AI skill extraction via spaCy NER",
                            "📊 JD matching with TF-IDF cosine similarity",
                            "📝 Grammar & language quality checks",
                        ].map((f) => (
                            <li
                                key={f}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>

                    {/* OAuth error banner */}
                    {oauthError && (
                        <div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-400">
                            {oauthError}
                        </div>
                    )}

                    {/* Google Sign-In */}
                    <a
                        href={`${backendUrl}/auth/google`}
                        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        Continue with Google
                    </a>

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        By signing in you agree to our{" "}
                        <span className="underline cursor-pointer hover:text-primary">
                            Terms of Service
                        </span>{" "}
                        &amp;{" "}
                        <span className="underline cursor-pointer hover:text-primary">
                            Privacy Policy
                        </span>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    AI Resume Analyzer © {new Date().getFullYear()}
                </p>
            </div>
        </main >
    );
}

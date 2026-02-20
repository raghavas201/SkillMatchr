import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: "AI Resume Analyzer — Intelligent Hiring Portal",
    description:
        "Analyze resumes with AI. Get ATS scores, skill extraction, grammar analysis, and JD matching in seconds.",
    keywords: ["resume analyzer", "ATS score", "hiring portal", "AI recruitment"],
    openGraph: {
        title: "AI Resume Analyzer",
        description: "AI-powered resume analysis and intelligent hiring portal",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="min-h-screen bg-background font-sans antialiased">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}

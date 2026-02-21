"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    FileText,
    LogOut,
    ChevronDown,
    Briefcase,
    Zap,
    BarChart2,
    Users,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/resumes", label: "My Resumes", icon: FileText },
    { href: "/jobs", label: "Job Matches", icon: Briefcase },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/recruiter", label: "Recruiter", icon: Users },
];

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="sticky top-0 z-50 border-b border-border/50 glass">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-md shadow-blue-500/20 transition-transform group-hover:scale-105">
                        <Zap size={16} className="text-white" />
                    </div>
                    <span className="font-bold tracking-tight gradient-text hidden sm:block">
                        AI Resume Analyzer
                    </span>
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                            <Icon size={15} />
                            {label}
                        </Link>
                    ))}
                </div>

                {/* User menu */}
                {user && (
                    <div className="flex items-center gap-3">
                        <div className="group relative flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-accent">
                            {user.avatar_url ? (
                                <Image
                                    src={user.avatar_url}
                                    alt={user.name}
                                    width={32}
                                    height={32}
                                    className="rounded-full ring-2 ring-border"
                                />
                            ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white">
                                    {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                                </div>
                            )}
                            <div className="hidden sm:block">
                                <p className="text-xs font-medium text-foreground leading-none">
                                    {user.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                                    {user.role}
                                </p>
                            </div>
                            <ChevronDown size={14} className="text-muted-foreground" />

                            {/* Dropdown */}
                            <div className="absolute top-full right-0 mt-1 hidden w-48 rounded-xl border border-border glass shadow-xl group-hover:block animate-fade-in">
                                <div className="p-2">
                                    <button
                                        onClick={logout}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        <LogOut size={14} />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

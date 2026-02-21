"use client";
/**
 * AnalyticsCharts — all chart components for the /analytics page.
 * Loaded dynamically with ssr:false to avoid recharts SSR crash.
 */
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

const SKILL_COLORS = ["#60a5fa", "#34d399", "#a78bfa", "#fb923c", "#f472b6", "#facc15"];

interface ScoreHistory {
    date: string; avg_ats: number; avg_quality: number; count: number;
}

interface SkillBar {
    name: string; count: number;
}

export function ScoreHistoryChart({ data }: { data: ScoreHistory[] }) {
    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="gAts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gQual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="avg_ats" name="ATS" stroke="#60a5fa" fill="url(#gAts)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="avg_quality" name="Quality" stroke="#34d399" fill="url(#gQual)" strokeWidth={2} dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function TopSkillsChart({ data }: { data: SkillBar[] }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" name="Resumes" radius={[0, 6, 6, 0]} maxBarSize={18}>
                    {data.map((_, i) => (
                        <Cell key={i} fill={SKILL_COLORS[i % SKILL_COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

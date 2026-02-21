"use client";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface Props {
    data: Array<{ date: string; count: number }>;
}

export default function ResumeChart({ data }: Props) {
    if (data.length < 2) return null;
    return (
        <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="count" name="Uploads" stroke="#60a5fa" fill="url(#gArea)" strokeWidth={2} dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

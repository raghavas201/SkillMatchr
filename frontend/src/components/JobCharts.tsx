"use client";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

interface BarItem { name: string; probability: number; }
interface RadarItem { subject: string;[key: string]: string | number; }

interface Props {
    barData: BarItem[];
    radarData: RadarItem[];
    top3Names: string[];
}

const RADAR_COLORS = ["#60a5fa", "#34d399", "#a78bfa"];

export default function JobCharts({ barData, radarData, top3Names }: Props) {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Bar chart — hiring probability */}
            {barData.length > 0 && (
                <div className="glass rounded-2xl p-6 animate-fade-in">
                    <h2 className="text-sm font-semibold text-foreground mb-4">Hiring Probability</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
                            <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} width={90} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                                formatter={(v: number) => [`${v}%`, "Hiring Probability"]}
                            />
                            <Bar dataKey="probability" radius={[0, 6, 6, 0]} maxBarSize={20}>
                                {barData.map((entry, i) => (
                                    <Cell key={i} fill={entry.probability >= 70 ? "#34d399" : entry.probability >= 50 ? "#60a5fa" : "#a78bfa"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Radar chart — top 3 comparison */}
            {top3Names.length >= 2 && (
                <div className="glass rounded-2xl p-6 animate-fade-in">
                    <h2 className="text-sm font-semibold text-foreground mb-1">Top 3 Candidate Comparison</h2>
                    <div className="flex gap-3 mb-2">
                        {top3Names.map((name, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full" style={{ background: RADAR_COLORS[i] }} />
                                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{name}</span>
                            </div>
                        ))}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.07)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            {top3Names.map((_, i) => (
                                <Radar key={i} name={`c${i}`} dataKey={`c${i}`} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.12} strokeWidth={2} />
                            ))}
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

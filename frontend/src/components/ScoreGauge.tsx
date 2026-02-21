"use client";
import {
    RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
} from "recharts";

interface Props {
    score: number;
    label: string;
    color: string;
}

export default function ScoreGauge({ score, label, color }: Props) {
    const data = [{ value: score, fill: color }];
    const textColor = color === "#34d399" ? "text-emerald-400" : "text-blue-400";
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative h-28 w-28">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%" cy="50%"
                        innerRadius="70%" outerRadius="100%"
                        startAngle={90} endAngle={-270}
                        data={data}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" />
                    </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${textColor}`}>{score.toFixed(0)}</span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
    );
}

"use client";
/**
 * Charts.tsx — Thin re-export of recharts components.
 * This file is imported via `dynamic(..., { ssr: false })` in page files
 * so that recharts (which uses window/document internally) never runs on
 * the server during Next.js static pre-rendering.
 */
export {
    AreaChart,
    Area,
    BarChart,
    Bar,
    RadarChart,
    Radar,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    PolarGrid,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from "recharts";

"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import api from "@/lib/axios";
import { clearToken } from "@/lib/axios";

export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url: string;
    role: "candidate" | "recruiter" | "admin";
    created_at: string;
}

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    logout: async () => { },
    refresh: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        try {
            const res = await api.get<{ user: User }>("/auth/me");
            setUser(res.data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            clearToken();
            setUser(null);
            window.location.href = "/";
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, refresh: fetchMe }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

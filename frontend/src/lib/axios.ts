import axios from "axios";

const TOKEN_KEY = "ai_resume_token";

export function saveToken(token: string) {
    if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
    if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
    withCredentials: true, // keep for same-origin cookie fallback
    timeout: 30_000,
});

// Attach JWT from localStorage as Bearer token on every request
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

// Redirect to login on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            typeof window !== "undefined" &&
            window.location.pathname !== "/"
        ) {
            clearToken();
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;

import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000",
    withCredentials: true, // send HttpOnly cookie automatically
    timeout: 30_000,
});

// Response interceptor: redirect to login on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/") // not already on login
        ) {
            window.location.href = "/";
        }
        return Promise.reject(error);
    }
);

export default api;

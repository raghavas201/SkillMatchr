import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require authentication
const protectedPaths = ["/dashboard", "/resumes", "/jobs", "/profile"];
// Paths only for unauthenticated users (redirect to /dashboard if already logged in)
const authPaths = ["/"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for JWT cookie (set by backend)
    const token = request.cookies.get("token")?.value;

    const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
    const isAuthPath = authPaths.includes(pathname);

    if (isProtected && !token) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    if (isAuthPath && token) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/resumes/:path*",
        "/jobs/:path*",
        "/profile/:path*",
    ],
};

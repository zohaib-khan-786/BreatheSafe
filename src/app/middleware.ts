import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes (auth & api)
  if (pathname.startsWith("/auth") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // ✅ If access token exists → allow
  if (accessToken) {
    return NextResponse.next();
  }

  // 🔄 If no access token but refresh token exists → call refresh API
  if (!accessToken && refreshToken) {
    try {
      const res = await fetch(new URL("/api/auth/refresh", req.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();

        const response = NextResponse.next();
        response.cookies.set("accessToken", data.accessToken, { httpOnly: true });
        if (data.refreshToken) {
          response.cookies.set("refreshToken", data.refreshToken, { httpOnly: true });
        }

        return response;
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  }

  // 🚫 If no tokens → redirect to login
  return NextResponse.redirect(new URL("/auth", req.url));
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};

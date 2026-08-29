import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionTokenEdge } from "@/lib/auth-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith("/adminpage");
  const isProtectedApi =
    pathname.startsWith("/api/technocore") || pathname.startsWith("/api/admin/me");

  if (!isAdminPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_session")?.value;
  const session = token ? await verifySessionTokenEdge(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/adminpage";
    loginUrl.searchParams.set("login", "1");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/adminpage/:path*", "/api/technocore/:path*", "/api/admin/me"],
};

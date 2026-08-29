import { NextResponse } from "next/server";
import {
  clearSessionCookieOptions,
  createSessionToken,
  getAdminCredentials,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  const creds = getAdminCredentials();
  if (!creds) {
    return NextResponse.json(
      { error: "ADMIN_USERNAME / ADMIN_PASSWORD 환경변수가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { username?: string; password?: string };
  if (body.username !== creds.username || body.password !== creds.password) {
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = createSessionToken(body.username!);
  const response = NextResponse.json({ ok: true, username: body.username });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearSessionCookieOptions());
  return response;
}

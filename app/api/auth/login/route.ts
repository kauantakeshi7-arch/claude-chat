import { NextRequest, NextResponse } from "next/server";
import { createSession, getAuthUsers } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Usuário e senha são obrigatórios" }, { status: 400 });
  }

  const users = getAuthUsers();
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return NextResponse.json({ error: "Usuário ou senha incorretos" }, { status: 401 });
  }

  const token = await createSession(username);
  const response = NextResponse.json({ ok: true, username });
  response.cookies.set("claude_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}

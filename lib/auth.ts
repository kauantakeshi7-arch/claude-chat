import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-troque-isso"
);
const COOKIE_NAME = "claude_session";

export interface SessionPayload {
  username: string;
  exp?: number;
}

export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  return token;
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function getAuthUsers(): { username: string; password: string }[] {
  const raw = process.env.AUTH_USERS || "";
  return raw
    .split(",")
    .map((entry) => {
      const [username, ...rest] = entry.trim().split(":");
      return { username: username?.trim(), password: rest.join(":").trim() };
    })
    .filter((u) => u.username && u.password);
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;

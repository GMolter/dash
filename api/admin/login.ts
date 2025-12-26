export const config = {
  runtime: "nodejs",
};

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { makeSessionCookie } from "../_utils/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const adminPassword = process.env.ADMIN_PASSWORD;
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET;

  if (!adminPassword || !cookieSecret) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const { password } = req.body || {};
  if (typeof password !== "string") return res.status(400).json({ error: "Invalid payload" });

  if (password !== adminPassword) return res.status(401).json({ error: "Invalid password" });

  res.setHeader("Set-Cookie", makeSessionCookie(cookieSecret));
  return res.status(200).json({ ok: true });
}

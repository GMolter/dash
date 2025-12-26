export const config = {
  runtime: "nodejs",
};

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAuthed } from "../_utils/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.ADMIN_COOKIE_SECRET;
  if (!secret) return res.status(500).json({ error: "Server not configured" });

  return res.status(200).json({ authed: isAuthed(req, secret) });
}

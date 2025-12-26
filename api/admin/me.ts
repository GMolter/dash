export const config = {
  runtime: "nodejs",
};

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAuthed } from "../_utils/session";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const secret = process.env.ADMIN_COOKIE_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Missing ADMIN_COOKIE_SECRET" });
    }

    return res.status(200).json({ authed: isAuthed(req, secret) });
  } catch (err: any) {
    console.error("admin/me crash:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

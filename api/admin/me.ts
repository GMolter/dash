export const config = { runtime: "nodejs" };

export default function handler(req: any, res: any) {
  try {
    const secret = process.env.ADMIN_COOKIE_SECRET;

    // Always return JSON (never Vercel crash page)
    if (!secret) return res.status(500).json({ error: "Missing ADMIN_COOKIE_SECRET" });

    return res.status(200).json({
      authed: false,
      hasCookie: Boolean(req.headers?.cookie),
      envOk: true
    });
  } catch (err: any) {
    console.error("admin/me crash:", err);
    return res.status(500).json({
      error: "Internal error",
      detail: String(err?.message || err)
    });
  }
}

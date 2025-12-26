export const config = { runtime: "nodejs" };

export default async function handler(req: any, res: any) {
  try {
    const secret = process.env.ADMIN_COOKIE_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Missing ADMIN_COOKIE_SECRET" });
    }

    // 🔒 Dynamic import — cannot crash at bundle time
    const { createHmac, timingSafeEqual } = await import("crypto");

    const header = req.headers?.cookie || "";
    const match = header.match(/(?:^|;\s*)admin_session=([^;]+)/);
    if (!match) {
      return res.status(200).json({ authed: false });
    }

    const token = match[1];
    const parts = token.split(".");
    if (parts.length !== 3) {
      return res.status(200).json({ authed: false });
    }

    const payload = `${parts[0]}.${parts[1]}`;
    const sig = parts[2];

    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (sig.length !== expected.length) {
      return res.status(200).json({ authed: false });
    }

    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return res.status(200).json({ authed: false });
    }

    return res.status(200).json({ authed: true });
  } catch (err: any) {
    console.error("admin/me runtime crash:", err);
    return res.status(500).json({
      error: "Internal error",
      detail: String(err?.message || err),
    });
  }
}

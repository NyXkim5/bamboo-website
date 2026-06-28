import { Resend } from "resend";

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const rateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const last = rateLimit.get(ip);
  const now = Date.now();
  if (last && now - last < RATE_LIMIT_MS) return true;
  rateLimit.set(ip, now);
  // Clean old entries every 100 requests
  if (rateLimit.size > 1000) {
    const cutoff = now - RATE_LIMIT_MS;
    for (const [key, ts] of rateLimit) {
      if (ts < cutoff) rateLimit.delete(key);
    }
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return Response.json(
        { error: "Too many requests. Try again in a minute." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return Response.json({ error: "Valid email required" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { error: "Waitlist not configured" },
        { status: 503 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    if (process.env.RESEND_AUDIENCE_ID) {
      await resend.contacts.create({
        audienceId: process.env.RESEND_AUDIENCE_ID,
        email,
      });
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL || "Bamboo <onboarding@resend.dev>",
      to: email,
      subject: "You're on the Bamboo waitlist!",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; color: #1A1A1A; margin-bottom: 16px;">Welcome to Bamboo</h1>
          <p style="font-size: 16px; color: #6B7280; line-height: 1.6;">
            You're on the list. We'll let you know as soon as Bamboo is ready for download.
          </p>
          <p style="font-size: 16px; color: #6B7280; line-height: 1.6;">
            In the meantime, Bao is doing a little happy dance for you.
          </p>
          <p style="font-size: 14px; color: #9CA3AF; margin-top: 32px;">
            The Bamboo Team
          </p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

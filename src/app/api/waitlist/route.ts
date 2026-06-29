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

    if (!process.env.RESEND_AUDIENCE_ID) {
      return Response.json(
        { error: "Waitlist not configured" },
        { status: 503 }
      );
    }

    await resend.contacts.create({
      audienceId: process.env.RESEND_AUDIENCE_ID,
      email,
    });

    const fromEmail = process.env.FROM_EMAIL;
    if (fromEmail) {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "You're on the list",
        text: `You're in.\n\nYou just secured early access to Bamboo. When we launch this summer, you will be first in line. Every feature. No charge.\n\nThat is it for now. No spam. Just one more email when it is time.\n\n- The Bamboo team`,
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("[waitlist]", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

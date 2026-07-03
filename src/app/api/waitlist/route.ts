import { Resend } from "resend";
import { normalizeEmail, processSignup } from "./waitlist-logic";

const rateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

const WELCOME_SUBJECT = "You're on the list";
const WELCOME_TEXT = `You're in.\n\nYou just secured early access to Bamboo. When we launch this summer, you will be first in line. Every feature. No charge.\n\nThat is it for now. No spam. Just one more email when it is time.\n\n- The Bamboo team`;

function isRateLimited(ip: string): boolean {
  const last = rateLimit.get(ip);
  const now = Date.now();
  if (last && now - last < RATE_LIMIT_MS) return true;
  rateLimit.set(ip, now);
  // Clean old entries once the map grows
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
    const email = normalizeEmail(body.email);
    if (!email) {
      return Response.json({ error: "Valid email required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!apiKey || !audienceId) {
      return Response.json({ error: "Waitlist not configured" }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.FROM_EMAIL;

    const result = await processSignup(email, {
      getContact: (e) => resend.contacts.get({ audienceId, email: e }),
      createContact: (e) => resend.contacts.create({ audienceId, email: e }),
      sendWelcome: (e) =>
        fromEmail
          ? resend.emails.send({
              from: fromEmail,
              to: e,
              subject: WELCOME_SUBJECT,
              text: WELCOME_TEXT,
            })
          : // No FROM_EMAIL configured: skip the welcome email without failing.
            Promise.resolve({ data: null, error: null }),
      logError: (context, detail) => console.error("[waitlist]", context, detail),
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ success: true, already: result.already });
  } catch (err) {
    // JSON parse failures and unexpected runtime errors land here.
    console.error("[waitlist]", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

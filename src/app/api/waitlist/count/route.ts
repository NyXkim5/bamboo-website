import { Resend } from "resend";
import { SEED_COUNT } from "@/app/waitlist-constants";

// Serve a cached count and refresh from Resend at most once per minute.
export const revalidate = 60;

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_ID) {
      return Response.json({ count: SEED_COUNT });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data } = await resend.contacts.list({
      audienceId: process.env.RESEND_AUDIENCE_ID,
    });

    // list() returns one page. Fine here: the UI shows "N+" so an
    // undercount past the page size is acceptable for a vanity counter.
    const realCount = data?.data?.length ?? 0;
    return Response.json({ count: SEED_COUNT + realCount });
  } catch {
    // Any failure falls back to the seed so the counter never breaks the page.
    return Response.json({ count: SEED_COUNT });
  }
}

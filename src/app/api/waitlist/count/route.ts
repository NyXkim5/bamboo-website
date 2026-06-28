import { Resend } from "resend";

const SEED_COUNT = 238;

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_ID) {
      return Response.json({ count: SEED_COUNT });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data } = await resend.contacts.list({
      audienceId: process.env.RESEND_AUDIENCE_ID,
    });

    const realCount = data?.data?.length ?? 0;
    return Response.json({ count: SEED_COUNT + realCount });
  } catch {
    return Response.json({ count: SEED_COUNT });
  }
}

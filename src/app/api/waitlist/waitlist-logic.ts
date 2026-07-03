const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export type ResendCallResult = {
  data: unknown;
  error: { message: string; name: string } | null;
};

export type SignupDeps = {
  getContact: (email: string) => Promise<ResendCallResult>;
  createContact: (email: string) => Promise<ResendCallResult>;
  sendWelcome: (email: string) => Promise<ResendCallResult>;
  logError: (context: string, detail: unknown) => void;
};

export type SignupResult =
  | { ok: true; already: boolean }
  | { ok: false; error: string };

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

export async function processSignup(
  email: string,
  deps: SignupDeps
): Promise<SignupResult> {
  // A get error (including not_found) means "treat as new" and try to create.
  const existing = await deps.getContact(email);
  if (existing.data) return { ok: true, already: true };

  const created = await deps.createContact(email);
  if (created.error) {
    // Safety net: if the get missed a duplicate, Resend rejects the create.
    if (created.error.message.toLowerCase().includes("already")) {
      return { ok: true, already: true };
    }
    deps.logError("contact create failed", created.error);
    return { ok: false, error: "Could not save your spot. Please try again." };
  }

  const welcome = await deps.sendWelcome(email);
  if (welcome.error) {
    // Contact is saved, which is what matters. Log and move on.
    deps.logError("welcome email failed", welcome.error);
  }

  return { ok: true, already: false };
}

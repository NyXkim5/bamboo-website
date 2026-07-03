import { describe, expect, it, vi } from "vitest";
import {
  normalizeEmail,
  processSignup,
  type ResendCallResult,
  type SignupDeps,
} from "./waitlist-logic";

function okResult(data: unknown = { id: "c_1" }): ResendCallResult {
  return { data, error: null };
}

function errResult(message: string, name = "application_error"): ResendCallResult {
  return { data: null, error: { message, name } };
}

function makeDeps(overrides: Partial<SignupDeps> = {}): SignupDeps {
  return {
    getContact: vi.fn(async () => errResult("Contact not found", "not_found")),
    createContact: vi.fn(async () => okResult()),
    sendWelcome: vi.fn(async () => okResult()),
    logError: vi.fn(),
    ...overrides,
  };
}

describe("normalizeEmail", () => {
  it("trims and lowercases a valid email", () => {
    expect(normalizeEmail("  Jay@Example.COM ")).toBe("jay@example.com");
  });

  it("rejects invalid formats", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail("a@b")).toBeNull();
    expect(normalizeEmail("")).toBeNull();
  });

  it("rejects non-strings", () => {
    expect(normalizeEmail(undefined)).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("processSignup", () => {
  it("returns already=true and skips create and welcome when contact exists", async () => {
    const deps = makeDeps({
      getContact: vi.fn(async () => okResult({ id: "c_1", email: "jay@example.com" })),
    });
    const result = await processSignup("jay@example.com", deps);
    expect(result).toEqual({ ok: true, already: true });
    expect(deps.createContact).not.toHaveBeenCalled();
    expect(deps.sendWelcome).not.toHaveBeenCalled();
  });

  it("creates the contact and sends the welcome email for a new signup", async () => {
    const deps = makeDeps();
    const result = await processSignup("jay@example.com", deps);
    expect(result).toEqual({ ok: true, already: false });
    expect(deps.createContact).toHaveBeenCalledWith("jay@example.com");
    expect(deps.sendWelcome).toHaveBeenCalledWith("jay@example.com");
  });

  it("returns ok=false and skips welcome when contact creation fails", async () => {
    const deps = makeDeps({
      createContact: vi.fn(async () => errResult("rate limit", "rate_limit_exceeded")),
    });
    const result = await processSignup("jay@example.com", deps);
    expect(result.ok).toBe(false);
    expect(deps.sendWelcome).not.toHaveBeenCalled();
    expect(deps.logError).toHaveBeenCalled();
  });

  it("treats a duplicate-contact create error as already on the list", async () => {
    const deps = makeDeps({
      createContact: vi.fn(async () => errResult("Contact already exists", "validation_error")),
    });
    const result = await processSignup("jay@example.com", deps);
    expect(result).toEqual({ ok: true, already: true });
    expect(deps.sendWelcome).not.toHaveBeenCalled();
  });

  it("still succeeds when the welcome email fails, but logs it", async () => {
    const deps = makeDeps({
      sendWelcome: vi.fn(async () => errResult("smtp down")),
    });
    const result = await processSignup("jay@example.com", deps);
    expect(result).toEqual({ ok: true, already: false });
    expect(deps.logError).toHaveBeenCalled();
  });
});

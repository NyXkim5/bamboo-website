import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import PrivacyPage from "./page";
import SupportPage from "../support/page";
import { FAQ_ITEMS } from "../faq";

// Support Vitest's standalone JSX transform without changing the Next.js setup.
beforeAll(() => vi.stubGlobal("React", React));
afterAll(() => vi.unstubAllGlobals());

describe("privacy disclosures", () => {
  it("shows the published effective date without draft wording", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("Effective September 16, 2026.");
    expect(html).not.toContain("effective on publication");
    expect(html).not.toContain("Prepared September");
  });

  it("renders the current photo model and provider retention disclosures", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html).toContain("google/gemma-3-27b-it");
    expect(html).toContain("up to 30 days");
    expect(html).toContain("do not claim a separately negotiated zero-retention");
    expect(html).toContain('href="https://docs.deepinfra.com/account/data-privacy"');
    expect(html).toContain('href="https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data"');
  });

  it("discloses account linkage, backup, sensitive insight data, and deletion limits", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    for (const disclosure of [
      "associated with your email or Apple identity",
      "not end-to-end encrypted",
      "cramps, discharge, or libido",
      "does not send raw food entries, period dates",
      "Uninstalling is not a server-account deletion request",
      "ArchvAI",
    ]) expect(html).toContain(disclosure);
  });

  it("keeps support and homepage answers consistent with optional sharing", () => {
    const support = renderToStaticMarkup(<SupportPage />);
    expect(support).toContain("optional cloud backup");
    expect(support).toContain("daily-insight consent");
    expect(support).toContain("if deletion fails, retry");
    const privacy = FAQ_ITEMS.find((item) => item.q === "Is my data private?")!.a;
    expect(privacy).toContain("account-linked copy");
    expect(privacy).toContain("Consented AI features");
    const all = support + renderToStaticMarkup(<PrivacyPage />) + JSON.stringify(FAQ_ITEMS);
    for (const stale of [
      "This data never leaves your phone",
      "We do not store health data on our servers",
      "We do not sell, rent, or share your personal data",
      "Processing is transient and we do not retain any of it",
      "We do not build a profile of you linked to your real identity",
    ]) expect(all).not.toContain(stale);
  });
});

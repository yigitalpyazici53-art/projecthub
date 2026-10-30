import type { Metadata } from "next";
import { publicMetadata } from "@/utils/seo";
import { LegalDoc, Section, P, A, Table } from "@/components/legal/LegalDoc";
import CookieSettingsButton from "@/components/legal/CookieSettingsButton";
import { CONTACT_EMAIL, GA_MEASUREMENT_ID, POLICY_UPDATED } from "@/utils/legal";

export const metadata: Metadata = publicMetadata({
  title: "Cookie Policy",
  description: "Every cookie and browser storage item ProjectHub uses, why, and for how long.",
  path: "/cookies",
});

const SUPABASE_REF = "hsimrgwjxxhsksdccrrm";
const GA_SUFFIX = GA_MEASUREMENT_ID.replace(/^G-/, "");

export default function CookiesPage() {
  return (
    <LegalDoc
      title="Cookie Policy"
      lead={
        <>
          This page lists every cookie and browser storage item ProjectHub uses. Strictly necessary items are always
          on; analytics cookies are only set after you click &ldquo;Accept&rdquo; in the cookie banner.
        </>
      }
      updated={POLICY_UPDATED}
      seeAlso={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
        { href: "/terms", label: "Terms of Service" },
      ]}
    >
      <Section title="Your choice">
        <P>
          You can change your choice at any time. Rejecting after you accepted removes the Google Analytics cookies
          and stops analytics from loading.
        </P>
        <CookieSettingsButton />
      </Section>

      <Section title="Strictly necessary">
        <P>These are needed for sign-in and to remember your cookie choice. They don&apos;t track you and can&apos;t be turned off.</P>
        <Table
          head={["Name", "Set by", "Purpose", "Type", "Duration"]}
          rows={[
            [<code key="n">sb-{SUPABASE_REF}-auth-token</code>, "ProjectHub (Supabase Auth)", "Keeps you signed in. Large sessions are split into numbered parts (…-auth-token.0, .1).", "Cookie (first-party)", "Up to 400 days, renewed while you use the site; removed when you sign out"],
            [<code key="n">sb-{SUPABASE_REF}-auth-token-code-verifier</code>, "ProjectHub (Supabase Auth)", "Secures the Google sign-in and password reset flows.", "Cookie (first-party)", "Only during sign-in; removed once you're signed in"],
            [<code key="n">ph_cookie_consent</code>, "ProjectHub", "Remembers whether you accepted or rejected analytics cookies.", "Local storage", "Until you clear your browser data"],
            [<code key="n">ph_consent_ok:…</code>, "ProjectHub", "Remembers, for the current tab, that you've confirmed the current policies.", "Session storage", "Until you close the tab"],
          ]}
        />
      </Section>

      <Section title="Analytics (only with your consent)">
        <P>
          If you accept, we load Google Analytics 4 to understand how the site is used (pages viewed, approximate
          location, device and browser). Analytics data is processed by Google in the USA. Advertising features are
          off (Consent Mode keeps ad storage and ad personalisation denied).
        </P>
        <Table
          head={["Name", "Set by", "Purpose", "Type", "Duration"]}
          rows={[
            [<code key="n">_ga</code>, "Google Analytics", "Distinguishes visitors.", "Cookie (first-party)", "2 years"],
            [<code key="n">_ga_{GA_SUFFIX}</code>, "Google Analytics", "Keeps the session state for our analytics property.", "Cookie (first-party)", "2 years"],
          ]}
        />
      </Section>

      <Section title="No other tracking">
        <P>
          We don&apos;t use advertising, social media or cross-site tracking cookies. Our hosting provider (Vercel)
          doesn&apos;t set cookies on ProjectHub. Questions: <A href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</A>.
        </P>
      </Section>
    </LegalDoc>
  );
}

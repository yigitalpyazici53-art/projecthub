"use client";

import Link from "next/link";
import { useState, type FormEvent, type ChangeEvent } from "react";
import Logo from "@/components/Logo";
import { createClient } from "@/utils/supabase/client";

type FormData = {
  full_name: string;
  email: string;
  university: string;
  role: string;
  skills: string;
  project_name: string;
  what_building: string;
  looking_for_teammates: "yes" | "no";
  roles_looking_for: string;
  github_url: string;
  linkedin_url: string;
  demo_url: string;
  why_join: string;
};

const INITIAL: FormData = {
  full_name: "",
  email: "",
  university: "",
  role: "",
  skills: "",
  project_name: "",
  what_building: "",
  looking_for_teammates: "yes",
  roles_looking_for: "",
  github_url: "",
  linkedin_url: "",
  demo_url: "",
  why_join: "",
};

export default function ApplyPage() {
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const field =
    (key: keyof FormData) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const supabase = createClient();
    const { error } = await supabase.from("builder_applications").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      university: form.university.trim() || null,
      role: form.role.trim() || null,
      skills: form.skills.trim() || null,
      project_name: form.project_name.trim() || null,
      what_building: form.what_building.trim() || null,
      looking_for_teammates: form.looking_for_teammates === "yes",
      looking_for_roles: form.roles_looking_for.trim() || null,
      github_url: form.github_url.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      demo_url: form.demo_url.trim() || null,
      why_join: form.why_join.trim() || null,
    });

    if (error) {
      setSubmitError("Something went wrong. Please try again in a moment.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <>
        <BgGrid />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              textAlign: "center",
              background:
                "linear-gradient(145deg, #FFFFFF, #FFFFFF)",
              border: "1px solid #E8E8E4",
              borderRadius: 20,
              padding: "56px 40px",
              boxShadow: "0 24px 64px rgba(26,26,24,0.4)",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#ECFDF5",
                border: "1px solid #D1FAE5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0F6E56"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 26,
                fontWeight: 500,
                color: "#1A1A18",
                marginBottom: 12,
                lineHeight: 1.1,
              }}
            >
              Application received
            </h1>
            <p
              style={{
                fontSize: 15,
                color: "#6B6B66",
                lineHeight: 1.65,
                marginBottom: 28,
                fontFamily: "var(--font-sans)",
              }}
            >
              Thanks for applying. We review every application manually to keep
              the network high-signal. We&apos;ll reach out within a few days.
            </p>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/projects"
                className="btn-secondary"
                style={{ fontSize: 14, padding: "10px 20px" }}
              >
                Browse projects
              </Link>
              <Link
                href="/"
                className="btn-primary"
                style={{ fontSize: 14, padding: "10px 20px" }}
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BgGrid />

      {/* Minimal nav */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 24px",
          background: "#FFFFFF",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid #F5F5F3",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            height: 60,
            gap: 16,
          }}
        >
          <Logo size="md" gradient />
          <div style={{ flex: 1 }} />
          <Link
            href="/login"
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              textDecoration: "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            Already a member? Sign in →
          </Link>
        </div>
      </nav>

      <main style={{ position: "relative", zIndex: 1, padding: "100px 24px 80px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>

          {/* Page header */}
          <div style={{ marginBottom: 48, textAlign: "center" }}>
            <div
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--accent)",
                background: "#F5F5F3",
                border: "1px solid #E8E8E4",
                borderRadius: 999,
                padding: "4px 14px",
                marginBottom: 20,
              }}
            >
              Early Access · Spots Limited
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontFamily: "var(--font-serif)",
                fontWeight: 500,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              Apply to join the first 100 builders
            </h1>
            <p
              style={{
                fontSize: 16,
                color: "var(--text-secondary)",
                lineHeight: 1.65,
                maxWidth: 520,
                margin: "0 auto",
                fontFamily: "var(--font-sans)",
              }}
            >
              ProjectHub is currently curated manually to keep the network
              high-signal. Tell us what you&apos;re building and who you&apos;re
              looking for.
            </p>
          </div>

          {/* Trust note */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 18px",
              background: "#ECFDF5",
              border: "1px solid #D1FAE5",
              borderRadius: 10,
              marginBottom: 32,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#0F6E56",
                boxShadow: "0 0 0 3px #D1FAE5",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <p
              style={{
                fontSize: 13,
                color: "#6B6B66",
                fontFamily: "var(--font-sans)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Every early application is reviewed manually so ProjectHub stays
              focused on real builders, not empty profiles.
            </p>
          </div>

          {/* Form card */}
          <div
            style={{
              background:
                "linear-gradient(145deg, #FFFFFF, #FFFFFF)",
              border: "1px solid #E8E8E4",
              borderRadius: 20,
              padding: "40px",
              boxShadow: "0 20px 60px rgba(26,26,24,0.4)",
            }}
          >
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 36 }}
            >

              {/* ── About you ─────────────────────────────────────────── */}
              <FormSection label="About you">
                <div style={twoCol}>
                  <Field label="Full name" required>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={field("full_name")}
                      placeholder="Your name"
                      required
                      style={inp}
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      type="email"
                      value={form.email}
                      onChange={field("email")}
                      placeholder="you@university.edu"
                      required
                      style={inp}
                    />
                  </Field>
                  <Field label="University">
                    <input
                      type="text"
                      value={form.university}
                      onChange={field("university")}
                      placeholder="e.g. MIT, Boğaziçi University"
                      style={inp}
                    />
                  </Field>
                  <Field
                    label="Your role"
                    required
                    hint="e.g. Full-stack developer, ML engineer, Designer"
                  >
                    <input
                      type="text"
                      value={form.role}
                      onChange={field("role")}
                      placeholder="Full-stack developer"
                      required
                      style={inp}
                    />
                  </Field>
                </div>
                <Field
                  label="Key skills"
                  hint="Comma separated — e.g. React, Python, Figma, Machine Learning"
                >
                  <input
                    type="text"
                    value={form.skills}
                    onChange={field("skills")}
                    placeholder="React, Python, Figma…"
                    style={inp}
                  />
                </Field>
              </FormSection>

              {/* ── Your project ──────────────────────────────────────── */}
              <FormSection label="Your project">
                <Field label="Project name">
                  <input
                    type="text"
                    value={form.project_name}
                    onChange={field("project_name")}
                    placeholder="e.g. Trckr, OfficeHours, Lecture.fm"
                    style={inp}
                  />
                </Field>
                <Field
                  label="What are you building?"
                  required
                  hint="Stage, problem you're solving, current progress — the more specific, the better"
                >
                  <textarea
                    value={form.what_building}
                    onChange={field("what_building")}
                    placeholder="We're building an AI-powered study planner for university students. Currently at MVP stage with 20 active users…"
                    required
                    rows={4}
                    style={{ ...inp, resize: "vertical", minHeight: 100 }}
                  />
                </Field>
              </FormSection>

              {/* ── Team ──────────────────────────────────────────────── */}
              <FormSection label="Team">
                <Field label="Are you looking for teammates?">
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["yes", "no"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, looking_for_teammates: opt }))
                        }
                        style={{
                          padding: "9px 22px",
                          borderRadius: 9,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          border: "1px solid",
                          background:
                            form.looking_for_teammates === opt
                              ? "#1A1A18"
                              : "#F7F7F5",
                          borderColor:
                            form.looking_for_teammates === opt
                              ? "transparent"
                              : "#E8E8E4",
                          color:
                            form.looking_for_teammates === opt
                              ? "white"
                              : "var(--text-secondary)",
                        }}
                      >
                        {opt === "yes" ? "Yes" : "Not right now"}
                      </button>
                    ))}
                  </div>
                </Field>
                {form.looking_for_teammates === "yes" && (
                  <Field
                    label="What roles are you looking for?"
                    hint="Comma separated — e.g. iOS Developer, ML Engineer, Product Designer"
                  >
                    <input
                      type="text"
                      value={form.roles_looking_for}
                      onChange={field("roles_looking_for")}
                      placeholder="iOS Developer, ML Engineer…"
                      style={inp}
                    />
                  </Field>
                )}
              </FormSection>

              {/* ── Links ─────────────────────────────────────────────── */}
              <FormSection label="Links">
                <div style={twoCol}>
                  <Field label="GitHub">
                    <input
                      type="url"
                      value={form.github_url}
                      onChange={field("github_url")}
                      placeholder="https://github.com/username"
                      style={inp}
                    />
                  </Field>
                  <Field label="LinkedIn">
                    <input
                      type="url"
                      value={form.linkedin_url}
                      onChange={field("linkedin_url")}
                      placeholder="https://linkedin.com/in/username"
                      style={inp}
                    />
                  </Field>
                </div>
                <Field
                  label="Demo / website"
                  hint="Live project, prototype, or any public work you want to share"
                >
                  <input
                    type="url"
                    value={form.demo_url}
                    onChange={field("demo_url")}
                    placeholder="https://yourproject.com"
                    style={inp}
                  />
                </Field>
              </FormSection>

              {/* ── Final question ────────────────────────────────────── */}
              <FormSection label="Final question">
                <Field
                  label="Why do you want to join ProjectHub?"
                  required
                  hint="Be specific — what you're working on, who you're looking for, what shipping means to you"
                >
                  <textarea
                    value={form.why_join}
                    onChange={field("why_join")}
                    placeholder="I'm building X because Y. I'm looking for a Z who can help with W. I ship weekly and want teammates who do the same…"
                    required
                    rows={5}
                    style={{ ...inp, resize: "vertical", minHeight: 120 }}
                  />
                </Field>
              </FormSection>

              <div>
                {submitError && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: "11px 16px",
                      borderRadius: 9,
                      background: "#FEF2F2",
                      border: "1px solid #FECACA",
                      color: "#B91C1C",
                      fontSize: 13,
                      fontFamily: "var(--font-sans)",
                      lineHeight: 1.5,
                    }}
                  >
                    {submitError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    fontSize: 15,
                    padding: "14px 24px",
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "wait" : "pointer",
                  }}
                >
                  {submitting ? "Submitting…" : "Apply to join the first 100 →"}
                </button>
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: "var(--text-muted)",
                    textAlign: "center",
                    fontFamily: "var(--font-sans)",
                    lineHeight: 1.5,
                  }}
                >
                  Every application is reviewed manually. We&apos;ll get back to
                  you within a few days.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function BgGrid() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(#F5F5F3 1px, transparent 1px),
            linear-gradient(90deg, #F5F5F3 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 100% 80% at 50% 0%, black 20%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "5%",
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle, #F5F5F3 0%, transparent 60%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, #F5F5F3 0%, transparent 60%)",
        }}
      />
    </div>
  );
}

function FormSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--accent)",
          paddingBottom: 12,
          marginBottom: 20,
          borderBottom: "1px solid #F5F5F3",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-secondary)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
        )}
      </label>
      {children}
      {hint && (
        <p
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontFamily: "var(--font-sans)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 9,
  background: "#F7F7F5",
  border: "1px solid #E8E8E4",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  fontFamily: "var(--font-sans)",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

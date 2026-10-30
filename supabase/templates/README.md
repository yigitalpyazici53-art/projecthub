# Auth email templates

Paste these into Supabase → Authentication → Emails → Templates. The dashboard
is the source of truth; keep these files in sync when you edit them there.

| Template | File | Subject |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | `Your ProjectHub verification code: {{ .Token }}` |
| Magic link | `magic-link.html` | `Your ProjectHub sign-in code: {{ .Token }}` |
| Reset password | `reset-password.html` | `Reset your ProjectHub password` |
| Change email address | `change-email.html` | `Confirm your new ProjectHub email` |

- Links go to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=…`
  (`app/auth/confirm/route.ts`), so they're on our domain, not supabase.co.
- Confirm signup and Magic link must keep `{{ .Token }}`: /signup asks for the
  code (`signInWithOtp` + `verifyOtp`). Both links use `type=email`, which
  covers new and existing users.
- No images or external resources.

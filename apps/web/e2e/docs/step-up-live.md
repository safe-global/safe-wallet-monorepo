# Live 2FA step-up suite

One command that clicks through every 2FA step-up (ElevationGuard) flow on a real environment and leaves an HTML
report with a video per flow. Run it before a release, or against a PR preview, to see in a few minutes whether
step-up still works.

It drives the real dev web app, CGW staging, Auth0 devstaging and the Stripe sandbox. It is not part of `pw:test` and
never runs in CI: sign-in needs the code Auth0 emails to the QA user.

## Run it

```bash
export STEP_UP_EMAIL=you+qa@safe.global          # email user with an authenticator enrolled
export STEP_UP_TOTP_SECRET=...                   # the secret shown under "Trouble scanning?" when enrolling
export STEP_UP_ADMIN_KEY=0x...                   # optional: wallet for the Sign-In-with-Ethereum and Create Safe flows
export STEP_UP_MEMBER_KEY=0x...                  # optional: second wallet that joins the Workspace as a member

yarn workspace @safe-global/web pw:step-up --headed
yarn workspace @safe-global/web pw:step-up:report
```

- **Sign-in:** a browser opens on Auth0 with the email filled in. Type the code from your inbox; the suite enters the
  authenticator code itself. The session is saved in `e2e/.auth/` (gitignored) and reused for about a day, so later
  runs skip this step and can run headless.
- **Unattended:** set `STEP_UP_EMAIL_CODE_FILE=/path/to/file` and write the emailed code into that file when asked.
- **Another build:** `PLAYWRIGHT_BASE_URL=https://<branch>--walletweb.review.5afe.dev`. Add
  `STEP_UP_FEATURE_FLAGS='{"SAFE_PRO_PLANS_V2":true}'` to seed feature-flag overrides.
- **Reuse a Workspace:** `STEP_UP_SPACE_ID=<uuid>` skips onboarding; the Workspace needs a plan and the user as admin.
- **Other window:** `STEP_UP_WINDOW_SECONDS` (default 60, the dev/staging `AUTH_ELEVATION_WINDOW_SECONDS`).

A full run takes about 30 minutes, because every step-up waits for the real 60 s window to lapse.

## What it covers

Each spec maps to the flow IDs of the Oct 1 QA report. Every step-up test asserts the gated request goes
`403 elevation_required` → Auth0 authenticator challenge → replay `2xx`, where the user lands, and what they see. A
follow-up action inside the window asserts that no second challenge comes.

| Spec                    | Flows                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `login.setup.ts`        | Email sign-in of an enrolled user: email code, then the authenticator (A31)                                                                                        |
| `01-onboarding`         | Create Workspace (A2), Claim free access with step-up (A12), Stripe Back (A13), trial (A3), onboarding invite (A4)                                                 |
| `02-safe-accounts`      | Add by address with a name (A5), rename (A6), remove in window (B1), Safe sidebar add (A38), Pay later on one (A23, A41) and two networks (A39)                    |
| `03-address-book`       | Add (A7), edit in window (B2), delete (A8), import local (A26), wrong code (A19), Back from the challenge (A20, A21), two tabs (A36)                               |
| `04-team`               | Invite (A9), remove invitation (A10), re-invite in window (B4); wallet member accepts and requests a contact (C1, C2); approve (A27), role (A29, B5), remove (A30) |
| `05-workspace-settings` | Rename (A11, B3); `DELETE /v1/spaces/:id` refused without a fresh code (A37)                                                                                       |
| `06-billing`            | Switch to Starter with trim (A15, A28), upgrade and plan changes in window (A16, P08), Stripe portal (A17), locked Workspace checkout (P04, A42)                   |
| `07-wallet-sign-in`     | A wallet admin does the same gated actions and never sees a challenge (C3–C11, C15)                                                                                |

Known results, marked in the report:

- `06-billing` A42 is an expected failure (`test.fail`) until WA-3706 is fixed (#8908); when it starts passing,
  Playwright reports it as "unexpectedly passed": remove the marker.
- A17 passes with a "known gap" annotation: the Stripe portal opens without 2FA.

Not covered: sign-up (A1) and recovery-code or authenticator changes (A16 recovery path, A18, A22), because they
rotate the QA user's recovery code and secret.

## Data it leaves behind

Each run creates two Workspaces on staging (email user and wallet admin) with a Stripe sandbox trial, plus
counterfactual Safes for the admin wallet. Names start with "Step-up". The Locked Workspace tests only rewrite the
subscription status in the test browser.

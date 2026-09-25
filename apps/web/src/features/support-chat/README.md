# Workspace support

The Wallet requests a Pylon identity from CGW using its existing authenticated
session. CGW chooses the help-only or premium widget from billing-materialized
Workspace subscriptions. The Safe Pro badge glows green only when CGW confirms
premium eligibility; it stays grey while loading, on errors, or without eligibility.

## Configuration handoff

Set `NEXT_PUBLIC_PYLON_CHAT_URL` to the deployed support host's `/chat` URL (see
`apps/web/.env.example`). Public environment values are read at build time, so
rebuild after changing them. Keep using the existing Gateway URL configuration.
No Auth0 client secret or Pylon JWT signing secret belongs in the Wallet.

Enable the existing Config Service `SUPPORT_CHAT` flag on the intended chains.
The entry also uses the existing official-host check. Workspace email login
requires its normal Workspace/OIDC configuration and Auth0 connections.

Coordinate with the companion CGW and support-host PRs. CGW's
`src/modules/support/README.md` contains credential placeholders, Auth0
callback settings, billing prerequisites, rollout order and manual local tests.
The host's `apps/host/.env.example` contains separate legacy HMAC, free JWT and
premium JWT widget IDs and exact parent origins. Deploy the host and CGW before enabling the Wallet entry point.

## Manual preview and acceptance

Run the Wallet using the repository's normal development setup, pointing both
Gateway environment URLs at your intended local CGW. Use a separately hosted
HTTPS support iframe; trust its local certificate in your browser. The production
integration does not include a preset server, simulated login or billing harness.

1. Open the Help menu and Workspace Settings → About. The Help menu uses a small
   inline Pro badge; About shows the matching Safe Pro live-chat description. Check light/dark
   themes and narrow screens; Help center remains a separate public link.
2. Sign in with verified email, then repeat with a wallet-only SIWE user. CGW
   needs Pylon credentials and its stable alias secret. Without
   an eligible subscription in any Workspace, support uses the help-only widget.
   Signed-out users receive a link to Workspace sign-in and can still use Help center.
   For wallet sign-in, sign out, connect the intended wallet, and approve SIWE.
   Connecting or switching wallets alone does not change the authenticated user.
3. Following the CGW manual-test instructions, deliver a valid authenticated
   billing event for your Workspace. `active`/`trialing` should enable the premium
   widget; cancellation should select help-only when no other Workspace qualifies.
   Close/reopen support after changes to request a fresh identity.
   The badge checks once per menu opening or About-page mount, with no timer or
   focus refresh. Reopen the menu or remount About after a billing change to update
   it. Opening support always obtains a fresh identity independently of the badge.
4. Check logout/user switching, unavailable-host recovery, and removal of the
   entry after refreshed chain data disables `SUPPORT_CHAT`.

The badge is presentation only. Neither the selected route nor browser-supplied
identity/entitlement fields are authorities for support eligibility.

Support identity keys include the authentication method and SIWE signer. A
confirmed identity change clears the old iframe; background auth reads preserve
it. Retry obtains a fresh CGW identity before mounting a new iframe. Normal JWT
refresh forwards updated settings to the existing host without remounting it;
widget or identity changes replace the frame. Vendor session expiry/revocation
and continuity across widgets still require manual acceptance.

Background refresh failures retry after 30, 60, 120, and 240 seconds, then every
five minutes until recovery. Success resets the delay; manual retry requests a
fresh identity immediately. Closing, changing users, or a 401/403/404 cancels retries
and clears the session.
Badge reads never start background refresh/retry timers.

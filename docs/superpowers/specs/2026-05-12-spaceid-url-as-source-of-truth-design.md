# Spec: `?spaceId` as the URL source of truth

**Date:** 2026-05-12
**Status:** Approved, ready for plan
**Scope:** `apps/web`

## Goal

Make `?spaceId=<id>` the single, URL-only source of truth for the current space. Signed-in users get it on every page; signed-out users with `?spaceId` get bounced to the spaces sign-in and back. Classic UI (no `spaceId`, no login) remains available for approximately one month behind a feature flag, then is removed in a follow-up cleanup PR.

This spec covers only the dual-flag rollout machinery and the URL/redirect contract. It does **not** include removing the classic UI itself.

## Non-goals

- Removing classic UI code paths (separate cleanup PR after the rollout window).
- Mobile (`apps/mobile`) — mobile uses its own navigation and is unaffected.
- Persisting `spaceId` across sessions for signed-out users — the URL is the only state; login is the gate.

## Feature flags

Two new entries in `FEATURES` (`packages/utils/src/utils/chains.ts`), both looked up against the **default chain** (`DEFAULT_CHAIN_ID` from `apps/web/src/config/constants.ts` — mainnet in production, Sepolia in staging) regardless of the user's current chain. The flags are uniform across chains; the default chain is the canonical source and lets staging exercise the flags via Sepolia while production reads them from mainnet.

| Flag                   | When ON                                                                                                                                                                          | When OFF                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `REQUIRE_SPACES_LOGIN` | Signed-in users get the full new flow: `spaceId` auto-injection, invalid-`spaceId` overwrite, redirect to `/spaces` when no spaces exist, bounce on `?spaceId` while signed-out. | `useSpaceIdSync` is fully inert. App behaves exactly as today.                                                                                 |
| `CLASSIC_UI_ENABLED`   | Signed-out users can browse all non-spaces routes as today.                                                                                                                      | Signed-out users on any non-excluded route are bounced to `/welcome/spaces?redirect=<asPath>`, regardless of whether `?spaceId` is in the URL. |

**Rollout:**

- Coexistence month: both flags **ON**.
- Day-30 cutover: flip `CLASSIC_UI_ENABLED` → **OFF**.
- Later: `REQUIRE_SPACES_LOGIN` stays ON; the flag and its branches are removed in a cleanup PR.

The split lets us independently roll back either dimension without a code revert.

### Lookup helper

Add `useHasDefaultChainFeature(feature: FEATURES): boolean | undefined` to `apps/web/src/hooks/useChains.ts`:

```ts
import { DEFAULT_CHAIN_ID } from '@/config/constants'

export const useHasDefaultChainFeature = (feature: FEATURES): boolean | undefined => {
  const defaultChain = useChain(String(DEFAULT_CHAIN_ID))
  return defaultChain ? hasFeature(defaultChain, feature) : undefined
}
```

A `undefined` return means "chains haven't loaded yet". `useSpaceIdSync` treats `undefined` as **enabled** (optimistic) to avoid a first-paint flash of classic UI for signed-in users. This matches the pattern used by `AuthState` for `FEATURES.SPACES`.

## Behavior matrix

Evaluated top-down; the first matching row wins.

| #   | `REQUIRE_LOGIN` | `CLASSIC_ENABLED` | Auth       | Has spaces?                  | `?spaceId` | Pathname    | Action                                         |
| --- | --------------- | ----------------- | ---------- | ---------------------------- | ---------- | ----------- | ---------------------------------------------- |
| 1   | OFF             | ON                | \*         | \*                           | \*         | \*          | no-op (legacy mode)                            |
| 2   | \*              | \*                | \*         | \*                           | \*         | excluded    | no-op                                          |
| 3   | \*              | OFF               | signed-out | n/a                          | \*         | any         | `replace('/welcome/spaces?redirect=<asPath>')` |
| 4   | \*              | \*                | signed-out | n/a                          | yes        | any         | `replace('/welcome/spaces?redirect=<asPath>')` |
| 5   | \*              | \*                | signed-out | n/a                          | no         | any         | no-op (classic mode)                           |
| 6   | OFF             | \*                | signed-in  | \*                           | \*         | any         | no-op                                          |
| 7   | ON              | \*                | signed-in  | spaces errored               | \*         | \*          | no-op (don't kick a working session)           |
| 8   | ON              | \*                | signed-in  | no spaces                    | n/a        | `/spaces/*` | no-op (user is in onboarding)                  |
| 9   | ON              | \*                | signed-in  | no spaces                    | n/a        | other       | `replace('/spaces')`                           |
| 10  | ON              | \*                | signed-in  | yes, member of `spaceId`     | yes        | any         | no-op                                          |
| 11  | ON              | \*                | signed-in  | yes, not member of `spaceId` | yes        | `/spaces/*` | no-op (`AuthState` shows Unauthorized)         |
| 12  | ON              | \*                | signed-in  | yes, not member of `spaceId` | yes        | other       | `replace(?spaceId=<firstOwnedSpace>)`          |
| 13  | ON              | \*                | signed-in  | yes                          | no         | any         | `replace(?spaceId=<firstOwnedSpace>)`, shallow |

### Excluded routes

Routes never touched by `useSpaceIdSync`:

- `/welcome/*` (all welcome flows: `spaces`, `createSpace`, `selectSafes`, `inviteMembers`)
- Legal: `/imprint`, `/privacy`, `/cookie`, `/terms`, `/licenses`, `/safe-labs-terms`
- Share / import: `/share/*`, `/import/*`
- Auth callbacks: `/hypernative/oauth-callback`, any future `/oidc/*`
- `/404`

Implemented as a `STARTS_WITH` + exact-match union so future subroutes under `/share`, `/import`, `/welcome` are auto-covered.

## Architecture

One global hook, mounted in `InitApp` inside `apps/web/src/pages/_app.tsx`:

- **`useSpaceIdSync()`** — orchestrator. Reads `router`, `isAuthenticated`, `selectIsOidcLoginPending`, `useSpacesGetV1Query`, both feature flags. Runs the matrix. Uses `router.replace` (not `push`) so back-button history stays clean.

Supporting modules — small and pure so the matrix is fully unit-testable without rendering:

- **`apps/web/src/hooks/useSpaceIdSync/excludedRoutes.ts`** — exported constant arrays + `isExcludedRoute(pathname): boolean`.
- **`apps/web/src/hooks/useSpaceIdSync/decide.ts`** — pure function:

  ```ts
  type Decision =
    | { action: 'noop' }
    | { action: 'inject'; spaceId: string }
    | { action: 'overwrite'; spaceId: string }
    | { action: 'bounceToSignIn'; redirect: string }
    | { action: 'forceOnboarding' }

  decide(input: {
    requireLogin: boolean | undefined
    classicEnabled: boolean | undefined
    isSignedIn: boolean
    isOidcPending: boolean
    pathname: string
    asPath: string
    querySpaceId: string | null
    userSpaceIds: string[] | undefined // undefined = not loaded yet
    spacesError: boolean
  }): Decision
  ```

  Table-driven tests cover every matrix row.

- **`apps/web/src/hooks/useSpaceIdSync/index.ts`** — calls `decide`, dispatches the router action inside one `useEffect`.

The rest of the app reads `spaceId` via the existing `useCurrentSpaceId()`, which becomes URL-only (`query.spaceId` → first-space fallback for the brief moment before sync injects). The Redux `lastUsedSpace` field, action, and selector are deleted.

## Sidebar variant switch

`useIsSpaceRoute()` returns `SPACES_ROUTES.includes(pathname)` and drops its `lastUsedSpace` dependency. The sidebar variant follows the URL pathname, not state.

`SPACES_ROUTES` stays as the explicit allowlist already in the file (`/spaces`, `/spaces/settings`, `/spaces/members`, `/spaces/safe-accounts`, `/spaces/address-book`). `/welcome/spaces` and `/spaces/create-space` correctly return `false` (the existing test covers this).

## Sign-in → return-to-original-URL flow

1. Signed-out user opens `/home?spaceId=42&safe=eth:0xabc`.
2. `useSpaceIdSync` matches row 4 → `router.replace('/welcome/spaces?redirect=/home?spaceId=42&safe=eth:0xabc')`.
3. User signs in on `/welcome/spaces`.
4. `useSignInRedirect` reads `router.query.redirect`, validates via `getSafeRedirectTarget` (must start with `/`, not `//`, not external), and `router.push(target)` once `isUserSignedIn && hasSignedIn`.
5. On the destination, `useSpaceIdSync` re-evaluates:
   - If user is a member of space `42` → no-op (row 10).
   - If not → overwrite with first owned space (row 12).
   - If they have zero spaces → force `/spaces` (row 9).

`redirect` always takes priority over the existing `createSpace` fallback in `useSignInRedirect`; if the user has zero spaces, the destination's `useSpaceIdSync` handles forcing them into onboarding. This keeps the two hooks' responsibilities separate.

`getSafeRedirectTarget` rejects `//evil.com`, `http://...`, empty strings, and non-strings. Open-redirect tests are mandatory.

## Removing `lastUsedSpace`

Delete:

- `lastUsedSpace` field in `AuthPayload` (`apps/web/src/store/authSlice.ts`).
- `setLastUsedSpace` action.
- `lastUsedSpace` selector.
- All call sites: `AuthState`, `useCurrentSpaceId`, `useIsSpaceRoute`, `useOnboardingNavigation`, `useSpaceSubmit`.

**redux-persist:** the field disappears from the persisted slice shape. Existing users will have it in `localStorage` from prior sessions — harmless; it'll be dropped on next persist. No migration needed because nothing reads it.

## Edge cases

1. **First-paint flicker.** Signed-in user opens `/home` (no `spaceId`). First paint = classic UI render, then `useSpaceIdSync` does `router.replace('/home?spaceId=X', undefined, { shallow: true })`. Page doesn't remount; only `useCurrentSpaceId`-consuming components rerender. Acceptable.
2. **Invalid `spaceId` on `/spaces/*`.** Row 11: sync hook does **not** overwrite. `AuthState` renders the Unauthorized state. Overwriting would mask the real error.
3. **`router.isReady` gating.** The hook waits for `router.isReady`. Before that, `router.query` is `{}` and we'd false-positive on "no `spaceId`".
4. **OIDC pending.** The hook short-circuits while `selectIsOidcLoginPending` is true to avoid racing the OIDC callback.
5. **Sign-out side effect.** After `setUnauthenticated`, the hook re-runs; if `?spaceId` is still in the URL it will bounce to `/welcome/spaces`. Acceptable — callers that want a softer landing should `router.push('/')` themselves on sign-out.
6. **Chains query in flight on first paint.** Both feature-flag hooks return `undefined`. Optimistic-enable means the hook behaves as if both flags are ON until chains load — i.e. signed-in users get sync, signed-out users with `?spaceId` get bounced. This is the desired behavior.
7. **`spaces` query errors with `REQUIRE_SPACES_LOGIN` ON.** Row 7: no-op. Better to leave the user on a working page than redirect them to `/spaces` based on a transient API error.

## Test plan

**Pure unit tests (no rendering):**

- `decide()` — table-driven, one case per matrix row, plus combinations of unknown / undefined inputs (chains not loaded, spaces not loaded).
- `isExcludedRoute()` — every excluded path, plus near-misses (`/welcomex`, `/sharing`).
- `getSafeRedirectTarget()` — accepts `/foo`, `/foo?bar=1`; rejects `//evil.com`, `http://evil.com`, `https://...`, empty string, non-string. Mandatory for open-redirect coverage.

**Hook tests (`renderHook`):**

- `useHasDefaultChainFeature` — returns the default chain's flag even when the user's current chain differs from it; returns `undefined` before chains load.
- `useSpaceIdSync` — for each matrix row, asserts the right `router.replace` call (or no call). Includes OIDC-pending short-circuit, `router.isReady=false` short-circuit, feature-flag-OFF short-circuit (no-op).
- `useSignInRedirect` — honors `redirect` query, ignores unsafe values, falls back to createSpace for zero-space new users when no `redirect` is set.
- `useIsSpaceRoute` — pure-pathname; tests already exist.

**E2E (Cypress, one happy path):**

- Signed-out user opens `/home?spaceId=42` → bounced to `/welcome/spaces` → signs in → lands on `/home?spaceId=42`.

## Files touched (estimate)

**New:**

- `apps/web/src/hooks/useSpaceIdSync/index.ts`
- `apps/web/src/hooks/useSpaceIdSync/decide.ts`
- `apps/web/src/hooks/useSpaceIdSync/excludedRoutes.ts`
- `apps/web/src/hooks/useSpaceIdSync/__tests__/decide.test.ts`
- `apps/web/src/hooks/useSpaceIdSync/__tests__/excludedRoutes.test.ts`
- `apps/web/src/hooks/useSpaceIdSync/__tests__/useSpaceIdSync.test.ts`
- `apps/web/src/hooks/__tests__/useIsSpaceRoute.test.ts` (already in tree)
- `apps/web/src/hooks/__tests__/useHasDefaultChainFeature.test.ts`
- `apps/web/cypress/e2e/spaces/spaceid-redirect.cy.ts`

**Modified:**

- `packages/utils/src/utils/chains.ts` — add `REQUIRE_SPACES_LOGIN`, `CLASSIC_UI_ENABLED` to `FEATURES`.
- `apps/web/src/hooks/useChains.ts` — add `useHasDefaultChainFeature`.
- `apps/web/src/hooks/useIsSpaceRoute.ts` — drop `lastUsedSpace`.
- `apps/web/src/pages/_app.tsx` — mount `useSpaceIdSync` in `InitApp`.
- `apps/web/src/store/authSlice.ts` — remove `lastUsedSpace` field, action, selector.
- `apps/web/src/store/__tests__/authSlice.test.ts` — remove related cases.
- `apps/web/src/features/spaces/hooks/useCurrentSpaceId.ts` — URL-only.
- `apps/web/src/features/spaces/components/AuthState/index.tsx` — drop `setLastUsedSpace` dispatch.
- `apps/web/src/features/spaces/components/CreateSpaceOnboarding/hooks/useSpaceSubmit.ts` — drop `setLastUsedSpace`.
- `apps/web/src/features/spaces/components/SelectSafesOnboarding/hooks/useOnboardingNavigation.ts` — drop `setLastUsedSpace`.
- `apps/web/src/components/welcome/WelcomeLogin/hooks/useSignInRedirect.ts` — honor `redirect` query.
- `apps/web/src/components/welcome/WelcomeLogin/hooks/__tests__/useSignInRedirect.test.ts` — new cases.
- Various story / test snapshot updates already in the uncommitted tree.

## Risks / not verified

- `DEFAULT_CHAIN_ID` assumes the chains list always contains the configured default chain (mainnet in prod, Sepolia in staging). If a deploy ever ships without it, both flags resolve to `undefined` → optimistic-enable → both behaviors active. This is the desired failure mode, but worth confirming the chains endpoint always returns the default chain in every env.
- `useSpacesGetV1Query` cache behavior across navigations — assumes RTK Query keeps the result cached so `useSpaceIdSync` doesn't refetch on every navigation. Verify during implementation.
- Existing prototype tests in the tree currently mock `useCurrentSpaceId` but the prototype hook reads `useSpacesGetV1Query` directly — those tests pass for unrelated reasons. The new test file will mock `useSpacesGetV1Query` explicitly.

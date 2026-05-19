# `?spaceId` URL Source-of-Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `?spaceId` the only source of truth for the current space, with a two-flag rollout that keeps classic UI available for ~1 month.

**Architecture:** One global hook (`useSpaceIdSync`) mounted in `InitApp` reads auth state, the user's spaces, and two cross-chain feature flags read from the default chain (`DEFAULT_CHAIN_ID`: mainnet in prod, Sepolia in staging). It delegates the entire state-transition matrix to a pure `decide()` function that returns one of five actions, which the hook then dispatches via `router.replace`. The pre-existing `lastUsedSpace` Redux field and all its dispatchers are deleted; the URL becomes the only persisted spaceId.

**Tech Stack:** Next.js (pages router), React 18, Redux Toolkit + RTK Query, Jest + Testing Library, Cypress.

**Spec:** `docs/superpowers/specs/2026-05-12-spaceid-url-as-source-of-truth-design.md`

**Reference (do not copy verbatim):** Uncommitted prototype code exists in the working tree (`apps/web/src/hooks/useSpaceIdSync.ts`, the modified `authSlice.ts`, `useCurrentSpaceId.ts`, `useIsSpaceRoute.ts`, etc.). Read it for intent but rebuild from the spec — it lacks the dual-flag logic, the default-chain lookup, and the pure-`decide` decomposition.

---

## File Structure

**New files:**

- `packages/utils/src/utils/chains.ts` — extended with two enum entries (modified, not new)
- `apps/web/src/hooks/useChains.ts` — extended with `useHasDefaultChainFeature` (modified)
- `apps/web/src/hooks/__tests__/useHasDefaultChainFeature.test.ts` — new
- `apps/web/src/hooks/useSpaceIdSync/excludedRoutes.ts` — new
- `apps/web/src/hooks/useSpaceIdSync/decide.ts` — new
- `apps/web/src/hooks/useSpaceIdSync/getSafeRedirectTarget.ts` — new
- `apps/web/src/hooks/useSpaceIdSync/index.ts` — new (the orchestrator hook)
- `apps/web/src/hooks/useSpaceIdSync/__tests__/excludedRoutes.test.ts` — new
- `apps/web/src/hooks/useSpaceIdSync/__tests__/decide.test.ts` — new
- `apps/web/src/hooks/useSpaceIdSync/__tests__/getSafeRedirectTarget.test.ts` — new
- `apps/web/src/hooks/useSpaceIdSync/__tests__/useSpaceIdSync.test.ts` — new
- `apps/web/cypress/e2e/spaces/spaceid-redirect.cy.ts` — new

**Modified files:**

- `apps/web/src/hooks/useIsSpaceRoute.ts` — drop `lastUsedSpace`
- `apps/web/src/hooks/__tests__/useIsSpaceRoute.test.ts` — already in tree, keep
- `apps/web/src/features/spaces/hooks/useCurrentSpaceId.ts` — drop Redux selector
- `apps/web/src/store/authSlice.ts` — delete `lastUsedSpace` field/action/selector
- `apps/web/src/store/__tests__/authSlice.test.ts` — drop related cases
- `apps/web/src/features/spaces/components/AuthState/index.tsx` — drop dispatch
- `apps/web/src/features/spaces/components/AuthState/index.test.tsx` — drop assertion
- `apps/web/src/features/spaces/components/CreateSpaceOnboarding/hooks/useSpaceSubmit.ts` — drop dispatch
- `apps/web/src/features/spaces/components/CreateSpaceOnboarding/hooks/useSpaceSubmit.test.ts` — drop assertion
- `apps/web/src/features/spaces/components/SelectSafesOnboarding/hooks/useOnboardingNavigation.ts` — drop dispatch
- `apps/web/src/components/welcome/WelcomeLogin/hooks/useSignInRedirect.ts` — honor `?redirect`
- `apps/web/src/components/welcome/WelcomeLogin/hooks/__tests__/useSignInRedirect.test.ts` — new cases
- `apps/web/src/pages/_app.tsx` — mount `useSpaceIdSync` in `InitApp`

---

## Conventions

- Use `git -c commit.gpgsign=true commit -S -m "..."` (the user requires GPG-signed commits). The Co-Authored-By trailer is mandatory.
- Use `yarn workspace @safe-global/web test <path>` to scope a single test file. Use `yarn workspace @safe-global/utils test <path>` for shared-package tests.
- Use sentence case for any user-visible string (none introduced by this plan).
- Never `any`. Where the test needs a partial `RootState`, cast through `unknown` then to the relevant type.

---

## Task 1: Add feature flag enum entries

**Files:**

- Modify: `packages/utils/src/utils/chains.ts`

- [ ] **Step 1: Add the two enum entries**

Open `packages/utils/src/utils/chains.ts` and find the closing `}` of the `FEATURES` enum (currently the line `WELCOME_ACCOUNTS_REDESIGN = 'WELCOME_ACCOUNTS_REDESIGN',` followed by `}`). Add two new entries before the closing brace:

```ts
  DISABLE_SPACES_LOGIN = 'DISABLE_SPACES_LOGIN',
  DISABLE_CLASSIC_UI = 'DISABLE_CLASSIC_UI',
```

- [ ] **Step 2: Type-check**

Run: `yarn workspace @safe-global/utils type-check`
Expected: PASS, no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/utils/src/utils/chains.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
feat: add DISABLE_SPACES_LOGIN and DISABLE_CLASSIC_UI feature flags

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `excludedRoutes` module

**Files:**

- Create: `apps/web/src/hooks/useSpaceIdSync/excludedRoutes.ts`
- Test: `apps/web/src/hooks/useSpaceIdSync/__tests__/excludedRoutes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/hooks/useSpaceIdSync/__tests__/excludedRoutes.test.ts
import { isExcludedRoute } from '../excludedRoutes'

describe('isExcludedRoute', () => {
  it.each([
    ['/welcome/spaces'],
    ['/welcome/createSpace'],
    ['/welcome/selectSafes'],
    ['/welcome/inviteMembers'],
    ['/welcome'],
    ['/welcome/anything-future'],
    ['/imprint'],
    ['/privacy'],
    ['/cookie'],
    ['/terms'],
    ['/licenses'],
    ['/safe-labs-terms'],
    ['/share/safe-app'],
    ['/share/anything'],
    ['/import/foo'],
    ['/hypernative/oauth-callback'],
    ['/oidc/callback'],
    ['/404'],
    ['/403'],
  ])('returns true for excluded route %s', (path) => {
    expect(isExcludedRoute(path)).toBe(true)
  })

  it.each([['/home'], ['/spaces'], ['/spaces/settings'], ['/transactions/queue'], ['/balances'], ['/']])(
    'returns false for non-excluded route %s',
    (path) => {
      expect(isExcludedRoute(path)).toBe(false)
    },
  )

  it('does not match near-misses', () => {
    expect(isExcludedRoute('/welcomex')).toBe(false)
    expect(isExcludedRoute('/sharing')).toBe(false)
    expect(isExcludedRoute('/importer')).toBe(false)
  })

  it('handles empty / nullish pathname', () => {
    expect(isExcludedRoute('')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/useSpaceIdSync/__tests__/excludedRoutes.test.ts`
Expected: FAIL — `Cannot find module '../excludedRoutes'`.

- [ ] **Step 3: Implement `excludedRoutes`**

Create `apps/web/src/hooks/useSpaceIdSync/excludedRoutes.ts`:

```ts
const EXACT_EXCLUDED: ReadonlyArray<string> = [
  '/imprint',
  '/privacy',
  '/cookie',
  '/terms',
  '/licenses',
  '/safe-labs-terms',
  '/404',
  '/403',
  '/hypernative/oauth-callback',
]

const PREFIX_EXCLUDED: ReadonlyArray<string> = ['/welcome', '/share', '/import', '/oidc']

export const isExcludedRoute = (pathname: string): boolean => {
  if (!pathname) return false
  if (EXACT_EXCLUDED.includes(pathname)) return true
  return PREFIX_EXCLUDED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/useSpaceIdSync/__tests__/excludedRoutes.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useSpaceIdSync/excludedRoutes.ts apps/web/src/hooks/useSpaceIdSync/__tests__/excludedRoutes.test.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
feat: add isExcludedRoute helper for spaceId sync

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `getSafeRedirectTarget` helper

**Files:**

- Create: `apps/web/src/hooks/useSpaceIdSync/getSafeRedirectTarget.ts`
- Test: `apps/web/src/hooks/useSpaceIdSync/__tests__/getSafeRedirectTarget.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/hooks/useSpaceIdSync/__tests__/getSafeRedirectTarget.test.ts
import { getSafeRedirectTarget } from '../getSafeRedirectTarget'

describe('getSafeRedirectTarget', () => {
  it('accepts absolute same-origin paths', () => {
    expect(getSafeRedirectTarget('/home')).toBe('/home')
    expect(getSafeRedirectTarget('/home?spaceId=42&safe=eth:0xabc')).toBe('/home?spaceId=42&safe=eth:0xabc')
    expect(getSafeRedirectTarget('/spaces/settings#section')).toBe('/spaces/settings#section')
  })

  it('rejects protocol-relative URLs', () => {
    expect(getSafeRedirectTarget('//evil.com')).toBeNull()
    expect(getSafeRedirectTarget('//evil.com/path')).toBeNull()
  })

  it('rejects absolute URLs to external hosts', () => {
    expect(getSafeRedirectTarget('http://evil.com')).toBeNull()
    expect(getSafeRedirectTarget('https://evil.com/path')).toBeNull()
    expect(getSafeRedirectTarget('javascript:alert(1)')).toBeNull()
  })

  it('rejects relative paths that do not start with /', () => {
    expect(getSafeRedirectTarget('home')).toBeNull()
    expect(getSafeRedirectTarget('../etc/passwd')).toBeNull()
  })

  it('rejects non-string and empty values', () => {
    expect(getSafeRedirectTarget('')).toBeNull()
    expect(getSafeRedirectTarget(undefined)).toBeNull()
    expect(getSafeRedirectTarget(null)).toBeNull()
    expect(getSafeRedirectTarget(['/home'])).toBeNull()
    expect(getSafeRedirectTarget(42)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/useSpaceIdSync/__tests__/getSafeRedirectTarget.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

Create `apps/web/src/hooks/useSpaceIdSync/getSafeRedirectTarget.ts`:

```ts
/**
 * Validates a redirect target from a query string. Allows only same-origin
 * absolute paths (e.g. "/home?x=1"). Rejects protocol-relative ("//evil.com"),
 * fully-qualified external URLs, javascript: URLs, and anything that isn't a
 * non-empty string starting with a single "/".
 */
export const getSafeRedirectTarget = (raw: unknown): string | null => {
  if (typeof raw !== 'string' || raw.length === 0) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//')) return null
  return raw
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/useSpaceIdSync/__tests__/getSafeRedirectTarget.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useSpaceIdSync/getSafeRedirectTarget.ts apps/web/src/hooks/useSpaceIdSync/__tests__/getSafeRedirectTarget.test.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
feat: add getSafeRedirectTarget for open-redirect protection

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `decide` pure function

**Files:**

- Create: `apps/web/src/hooks/useSpaceIdSync/decide.ts`
- Test: `apps/web/src/hooks/useSpaceIdSync/__tests__/decide.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/hooks/useSpaceIdSync/__tests__/decide.test.ts
import { decide, type DecideInput, type Decision } from '../decide'

const baseInput: DecideInput = {
  requireLogin: true,
  classicEnabled: true,
  isSignedIn: false,
  isOidcPending: false,
  pathname: '/home',
  asPath: '/home',
  querySpaceId: null,
  userSpaceIds: undefined,
  spacesError: false,
}

const make = (overrides: Partial<DecideInput> = {}): DecideInput => ({ ...baseInput, ...overrides })

describe('decide', () => {
  it('row 1 — REQUIRE_LOGIN off + CLASSIC on → noop', () => {
    expect(decide(make({ requireLogin: false, classicEnabled: true }))).toEqual<Decision>({ action: 'noop' })
  })

  it('row 2 — excluded route always noop, regardless of flags / auth', () => {
    expect(decide(make({ pathname: '/welcome/spaces', isSignedIn: true, userSpaceIds: ['1'] }))).toEqual<Decision>({
      action: 'noop',
    })
    expect(decide(make({ pathname: '/imprint', isSignedIn: false, querySpaceId: '42' }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 2.5 — OIDC pending → noop', () => {
    expect(decide(make({ isOidcPending: true, isSignedIn: true, userSpaceIds: ['1'] }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 3 — CLASSIC off + signed-out → bounce to sign-in', () => {
    expect(decide(make({ classicEnabled: false, asPath: '/home' }))).toEqual<Decision>({
      action: 'bounceToSignIn',
      redirect: '/home',
    })
  })

  it('row 4 — signed-out + ?spaceId → bounce to sign-in (even if CLASSIC on)', () => {
    expect(decide(make({ querySpaceId: '42', asPath: '/home?spaceId=42&safe=eth:0xabc' }))).toEqual<Decision>({
      action: 'bounceToSignIn',
      redirect: '/home?spaceId=42&safe=eth:0xabc',
    })
  })

  it('row 5 — signed-out + no ?spaceId + CLASSIC on → noop', () => {
    expect(decide(make({ querySpaceId: null }))).toEqual<Decision>({ action: 'noop' })
  })

  it('row 6 — REQUIRE_LOGIN off + signed-in → noop', () => {
    expect(decide(make({ requireLogin: false, isSignedIn: true, userSpaceIds: ['1'] }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 7 — signed-in + spaces errored → noop', () => {
    expect(decide(make({ isSignedIn: true, spacesError: true, userSpaceIds: undefined }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('signed-in + spaces not loaded yet → noop', () => {
    expect(decide(make({ isSignedIn: true, userSpaceIds: undefined }))).toEqual<Decision>({ action: 'noop' })
  })

  it('row 8 — signed-in + no spaces + already on /spaces → noop', () => {
    expect(decide(make({ isSignedIn: true, userSpaceIds: [], pathname: '/spaces' }))).toEqual<Decision>({
      action: 'noop',
    })
    expect(decide(make({ isSignedIn: true, userSpaceIds: [], pathname: '/spaces/settings' }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 9 — signed-in + no spaces + non-/spaces route → forceOnboarding', () => {
    expect(decide(make({ isSignedIn: true, userSpaceIds: [], pathname: '/home' }))).toEqual<Decision>({
      action: 'forceOnboarding',
    })
  })

  it('row 10 — signed-in + member of querySpaceId → noop', () => {
    expect(decide(make({ isSignedIn: true, userSpaceIds: ['42', '7'], querySpaceId: '42' }))).toEqual<Decision>({
      action: 'noop',
    })
  })

  it('row 11 — signed-in + not member of querySpaceId on /spaces/* → noop (AuthState handles it)', () => {
    expect(
      decide(make({ isSignedIn: true, userSpaceIds: ['7'], querySpaceId: '42', pathname: '/spaces/settings' })),
    ).toEqual<Decision>({ action: 'noop' })
  })

  it('row 12 — signed-in + not member of querySpaceId on non-/spaces → overwrite with first owned', () => {
    expect(
      decide(make({ isSignedIn: true, userSpaceIds: ['7', '9'], querySpaceId: '42', pathname: '/home' })),
    ).toEqual<Decision>({ action: 'overwrite', spaceId: '7' })
  })

  it('row 13 — signed-in + no ?spaceId → inject first owned', () => {
    expect(
      decide(make({ isSignedIn: true, userSpaceIds: ['7', '9'], querySpaceId: null, pathname: '/home' })),
    ).toEqual<Decision>({ action: 'inject', spaceId: '7' })
  })

  it('treats undefined flags as enabled (optimistic)', () => {
    expect(
      decide(make({ requireLogin: undefined, classicEnabled: undefined, isSignedIn: false, querySpaceId: '42' })),
    ).toEqual<Decision>({ action: 'bounceToSignIn', redirect: '/home' })

    expect(
      decide(make({ requireLogin: undefined, classicEnabled: undefined, isSignedIn: true, userSpaceIds: ['7'] })),
    ).toEqual<Decision>({ action: 'inject', spaceId: '7' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/useSpaceIdSync/__tests__/decide.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `decide`**

Create `apps/web/src/hooks/useSpaceIdSync/decide.ts`:

```ts
import { isExcludedRoute } from './excludedRoutes'

export type DecideInput = {
  requireLogin: boolean | undefined
  classicEnabled: boolean | undefined
  isSignedIn: boolean
  isOidcPending: boolean
  pathname: string
  asPath: string
  querySpaceId: string | null
  userSpaceIds: string[] | undefined
  spacesError: boolean
}

export type Decision =
  | { action: 'noop' }
  | { action: 'inject'; spaceId: string }
  | { action: 'overwrite'; spaceId: string }
  | { action: 'bounceToSignIn'; redirect: string }
  | { action: 'forceOnboarding' }

const NOOP: Decision = { action: 'noop' }

const isSpacesPath = (pathname: string): boolean => pathname === '/spaces' || pathname.startsWith('/spaces/')

// Optimistic-enable: treat undefined (flags not loaded yet) as enabled.
const enabled = (flag: boolean | undefined): boolean => flag !== false

export const decide = (input: DecideInput): Decision => {
  const {
    requireLogin,
    classicEnabled,
    isSignedIn,
    isOidcPending,
    pathname,
    asPath,
    querySpaceId,
    userSpaceIds,
    spacesError,
  } = input

  // Row 1: legacy mode — both flags must be ON for anything to happen.
  if (requireLogin === false && enabled(classicEnabled)) return NOOP

  // Row 2: excluded route or OIDC handshake in flight.
  if (isExcludedRoute(pathname)) return NOOP
  if (isOidcPending) return NOOP

  if (!isSignedIn) {
    // Row 3: classic killed — every non-excluded route requires sign-in.
    if (classicEnabled === false) return { action: 'bounceToSignIn', redirect: asPath }
    // Row 4: signed-out user followed a ?spaceId link — needs to sign in.
    if (querySpaceId) return { action: 'bounceToSignIn', redirect: asPath }
    // Row 5: classic mode.
    return NOOP
  }

  // Signed-in path.

  // Row 6: REQUIRE_LOGIN off — new flow is gated off.
  if (requireLogin === false) return NOOP

  // Row 7: don't kick a working session if the spaces query failed.
  if (spacesError) return NOOP

  // Spaces still loading — wait.
  if (userSpaceIds === undefined) return NOOP

  if (userSpaceIds.length === 0) {
    // Row 8: already on /spaces/* — let onboarding render.
    if (isSpacesPath(pathname)) return NOOP
    // Row 9: force into onboarding.
    return { action: 'forceOnboarding' }
  }

  if (querySpaceId) {
    // Row 10: member of the URL's space.
    if (userSpaceIds.includes(querySpaceId)) return NOOP
    // Row 11: not a member but on /spaces/* — AuthState handles Unauthorized.
    if (isSpacesPath(pathname)) return NOOP
    // Row 12: not a member on a non-spaces page — overwrite silently.
    return { action: 'overwrite', spaceId: userSpaceIds[0] }
  }

  // Row 13: no ?spaceId — inject the first owned space.
  return { action: 'inject', spaceId: userSpaceIds[0] }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/useSpaceIdSync/__tests__/decide.test.ts`
Expected: PASS, all rows.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useSpaceIdSync/decide.ts apps/web/src/hooks/useSpaceIdSync/__tests__/decide.test.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
feat: add pure decide() function for spaceId sync state machine

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `useHasDefaultChainFeature` hook

**Files:**

- Modify: `apps/web/src/hooks/useChains.ts`
- Test: `apps/web/src/hooks/__tests__/useHasDefaultChainFeature.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/hooks/__tests__/useHasDefaultChainFeature.test.ts
import { renderHook } from '@/tests/test-utils'
import { useHasDefaultChainFeature } from '../useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as useChainsModule from '../useChains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'

describe('useHasDefaultChainFeature', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns true when the default chain has the feature enabled', () => {
    jest
      .spyOn(useChainsModule, 'useChain')
      .mockReturnValue({ chainId: String(DEFAULT_CHAIN_ID), features: ['DISABLE_SPACES_LOGIN'] } as never)

    const { result } = renderHook(() => useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN))
    expect(result.current).toBe(true)
  })

  it('returns false when the default chain does not have the feature', () => {
    jest
      .spyOn(useChainsModule, 'useChain')
      .mockReturnValue({ chainId: String(DEFAULT_CHAIN_ID), features: ['SPACES'] } as never)

    const { result } = renderHook(() => useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN))
    expect(result.current).toBe(false)
  })

  it('returns undefined when chains have not loaded', () => {
    jest.spyOn(useChainsModule, 'useChain').mockReturnValue(undefined)

    const { result } = renderHook(() => useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN))
    expect(result.current).toBeUndefined()
  })

  it('looks up DEFAULT_CHAIN_ID regardless of the user current chain', () => {
    const useChainSpy = jest
      .spyOn(useChainsModule, 'useChain')
      .mockReturnValue({ chainId: String(DEFAULT_CHAIN_ID), features: [] } as never)

    renderHook(() => useHasDefaultChainFeature(FEATURES.DISABLE_CLASSIC_UI))

    expect(useChainSpy).toHaveBeenCalledWith(String(DEFAULT_CHAIN_ID))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/__tests__/useHasDefaultChainFeature.test.ts`
Expected: FAIL — `useHasDefaultChainFeature` not exported.

- [ ] **Step 3: Add the hook**

Open `apps/web/src/hooks/useChains.ts` and, immediately after the existing `useHasFeature` export (around line 55, after `return currentChain ? hasFeature(currentChain, feature) : undefined`), add:

```ts
import { DEFAULT_CHAIN_ID } from '@/config/constants'

/**
 * Checks if a feature is enabled on the deploy's default chain (mainnet in
 * production, Sepolia in staging — see `DEFAULT_CHAIN_ID`). Used for global,
 * cross-chain feature flags (e.g. rollout toggles) whose value must not depend
 * on the user's currently selected chain. The flag is expected to be uniform
 * across chains; the default chain is the canonical source.
 *
 * Returns `undefined` while the chain config is loading.
 */
export const useHasDefaultChainFeature = (feature: FEATURES): boolean | undefined => {
  const defaultChain = useChain(String(DEFAULT_CHAIN_ID))
  return defaultChain ? hasFeature(defaultChain, feature) : undefined
}
```

Note: `DEFAULT_CHAIN_ID` is a `number` (see `apps/web/src/config/constants.ts`); convert to string before passing to `useChain`.

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/__tests__/useHasDefaultChainFeature.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useChains.ts apps/web/src/hooks/__tests__/useHasDefaultChainFeature.test.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
feat: add useHasDefaultChainFeature hook for global rollout flags

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `useSpaceIdSync` hook (orchestrator)

**Files:**

- Create: `apps/web/src/hooks/useSpaceIdSync/index.ts`
- Test: `apps/web/src/hooks/useSpaceIdSync/__tests__/useSpaceIdSync.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/hooks/useSpaceIdSync/__tests__/useSpaceIdSync.test.ts
import { renderHook } from '@/tests/test-utils'
import { useSpaceIdSync } from '../index'
import * as store from '@/store'
import * as useChainsModule from '@/hooks/useChains'
import * as spacesApi from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

type AuthState = { isAuthenticated?: boolean; isOidcLoginPending?: boolean }

const mockAuth = ({ isAuthenticated = false, isOidcLoginPending = false }: AuthState = {}) => {
  jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
    const fakeState = {
      auth: {
        sessionExpiresAt: isAuthenticated ? Date.now() + 60_000 : null,
        isStoreHydrated: true,
        isOidcLoginPending,
      },
    }
    return selector(fakeState as unknown as store.RootState)
  })
}

const mockFlags = ({
  requireLogin = true,
  classicEnabled = true,
}: { requireLogin?: boolean | undefined; classicEnabled?: boolean | undefined } = {}) => {
  jest.spyOn(useChainsModule, 'useHasDefaultChainFeature').mockImplementation((feature) => {
    if (feature === 'DISABLE_SPACES_LOGIN') return requireLogin
    if (feature === 'DISABLE_CLASSIC_UI') return classicEnabled
    return undefined
  })
}

const mockSpaces = (spaceIds: string[] | null, isError = false) => {
  const data: GetSpaceResponse[] | undefined =
    spaceIds === null
      ? undefined
      : spaceIds.map((id) => ({ id: Number(id), name: `s${id}`, members: [], safeCount: 0 }))
  jest.spyOn(spacesApi, 'useSpacesGetV1Query').mockReturnValue({
    data,
    isError,
    isLoading: data === undefined && !isError,
    isFetching: false,
    refetch: jest.fn(),
  } as never)
}

describe('useSpaceIdSync', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('injects ?spaceId for signed-in user with no spaceId in URL', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { spaceId: '7' } }, undefined, { shallow: true })
  })

  it('overwrites invalid ?spaceId on non-/spaces route', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/home',
        asPath: '/home?spaceId=99',
        query: { spaceId: '99' },
        replace,
      },
    })

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { spaceId: '7' } }, undefined, { shallow: true })
  })

  it('leaves invalid ?spaceId alone on /spaces/* routes', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/spaces/settings',
        asPath: '/spaces/settings?spaceId=99',
        query: { spaceId: '99' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('forces signed-in user with zero spaces to /spaces', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces([])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).toHaveBeenCalledWith({ pathname: '/spaces' })
  })

  it('bounces signed-out user with ?spaceId to sign-in with redirect', () => {
    mockAuth({ isAuthenticated: false })
    mockFlags()
    mockSpaces(null)
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/home',
        asPath: '/home?spaceId=42&safe=eth:0xabc',
        query: { spaceId: '42', safe: 'eth:0xabc' },
        replace,
      },
    })

    expect(replace).toHaveBeenCalledWith({
      pathname: '/welcome/spaces',
      query: { redirect: '/home?spaceId=42&safe=eth:0xabc' },
    })
  })

  it('bounces signed-out user even without ?spaceId when CLASSIC is disabled', () => {
    mockAuth({ isAuthenticated: false })
    mockFlags({ classicEnabled: false })
    mockSpaces(null)
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).toHaveBeenCalledWith({
      pathname: '/welcome/spaces',
      query: { redirect: '/home' },
    })
  })

  it('is inert when DISABLE_SPACES_LOGIN is off (legacy mode)', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags({ requireLogin: false, classicEnabled: true })
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('skips excluded routes', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/welcome/spaces',
        asPath: '/welcome/spaces',
        query: {},
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('does not act before router.isReady', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(['7'])
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: false, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('does not redirect when OIDC sign-in is pending', () => {
    mockAuth({ isAuthenticated: false, isOidcLoginPending: true })
    mockFlags()
    mockSpaces(null)
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: {
        isReady: true,
        pathname: '/home',
        asPath: '/home?spaceId=42',
        query: { spaceId: '42' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('does not kick the user when spaces query errored', () => {
    mockAuth({ isAuthenticated: true })
    mockFlags()
    mockSpaces(null, true)
    const replace = jest.fn()

    renderHook(() => useSpaceIdSync(), {
      routerProps: { isReady: true, pathname: '/home', asPath: '/home', query: {}, replace },
    })

    expect(replace).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/useSpaceIdSync/__tests__/useSpaceIdSync.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the hook**

Create `apps/web/src/hooks/useSpaceIdSync/index.ts`:

```ts
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsOidcLoginPending } from '@/store/authSlice'
import { useHasDefaultChainFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { decide } from './decide'

const getQuerySpaceId = (query: Record<string, string | string[] | undefined>): string | null => {
  const raw = query.spaceId
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

/**
 * Keeps `?spaceId` in sync with auth state across the whole app.
 * See docs/superpowers/specs/2026-05-12-spaceid-url-as-source-of-truth-design.md
 * for the behavior matrix. Mount once in InitApp.
 */
export const useSpaceIdSync = (): void => {
  const router = useRouter()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isOidcPending = useAppSelector(selectIsOidcLoginPending)
  const requireLogin = useHasDefaultChainFeature(FEATURES.DISABLE_SPACES_LOGIN)
  const classicEnabled = useHasDefaultChainFeature(FEATURES.DISABLE_CLASSIC_UI)
  const { data: spaces, isError: spacesError } = useSpacesGetV1Query(undefined, { skip: !isSignedIn })

  useEffect(() => {
    if (!router.isReady) return

    const decision = decide({
      requireLogin,
      classicEnabled,
      isSignedIn,
      isOidcPending,
      pathname: router.pathname,
      asPath: router.asPath,
      querySpaceId: getQuerySpaceId(router.query),
      userSpaceIds: spaces ? spaces.map((s) => String(s.id)) : undefined,
      spacesError,
    })

    switch (decision.action) {
      case 'noop':
        return
      case 'inject':
      case 'overwrite':
        router.replace(
          { pathname: router.pathname, query: { ...router.query, spaceId: decision.spaceId } },
          undefined,
          { shallow: true },
        )
        return
      case 'forceOnboarding':
        router.replace({ pathname: AppRoutes.spaces.index })
        return
      case 'bounceToSignIn':
        router.replace({
          pathname: AppRoutes.welcome.spaces,
          query: { redirect: decision.redirect },
        })
        return
    }
  }, [router, isSignedIn, isOidcPending, requireLogin, classicEnabled, spaces, spacesError])
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/useSpaceIdSync/__tests__/useSpaceIdSync.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/hooks/useSpaceIdSync/index.ts apps/web/src/hooks/useSpaceIdSync/__tests__/useSpaceIdSync.test.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
feat: add useSpaceIdSync hook orchestrating spaceId URL state

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update `useSignInRedirect` to honor `?redirect`

**Files:**

- Modify: `apps/web/src/components/welcome/WelcomeLogin/hooks/useSignInRedirect.ts`
- Test: `apps/web/src/components/welcome/WelcomeLogin/hooks/__tests__/useSignInRedirect.test.ts`

- [ ] **Step 1: Read existing test file**

Read `apps/web/src/components/welcome/WelcomeLogin/hooks/__tests__/useSignInRedirect.test.ts` to understand the existing setup pattern (router mock, RTK Query mocks, etc.). Existing cases must keep passing.

- [ ] **Step 2: Add failing tests for redirect behavior**

Append these cases inside the top-level `describe('useSignInRedirect', ...)`:

```ts
import { getSafeRedirectTarget } from '@/hooks/useSpaceIdSync/getSafeRedirectTarget'

// ... existing tests above ...

it('redirects to safe ?redirect target after sign-in, ignoring isNewUser flow', async () => {
  const push = jest.fn()
  const { result } = renderHook(
    () => useSignInRedirect({ spacesAmount: 0, inviteAmount: 0, isSpacesLoading: false, error: undefined }),
    {
      routerProps: {
        push,
        query: { redirect: '/home?spaceId=42' },
        isReady: true,
      },
    },
  )

  act(() => result.current.setHasSignedIn(true))

  // wait for the effect tick
  await Promise.resolve()

  expect(push).toHaveBeenCalledWith('/home?spaceId=42')
})

it('ignores unsafe ?redirect values', async () => {
  const push = jest.fn()
  const { result } = renderHook(
    () => useSignInRedirect({ spacesAmount: 1, inviteAmount: 0, isSpacesLoading: false, error: undefined }),
    {
      routerProps: {
        push,
        query: { redirect: '//evil.com' },
        isReady: true,
      },
    },
  )

  act(() => result.current.setHasSignedIn(true))
  await Promise.resolve()

  // Should not navigate based on the unsafe value
  expect(push).not.toHaveBeenCalledWith('//evil.com')
})
```

If the existing test file does not already import `act` and `renderHook` together, add the imports from `@/tests/test-utils` and `@testing-library/react` to match the existing patterns. Also ensure `isUserSignedIn` is true in the test scenario — check how the existing tests stub auth (likely via the redux test store helper) and reuse that pattern.

- [ ] **Step 3: Run tests to verify the new cases fail**

Run: `yarn workspace @safe-global/web test apps/web/src/components/welcome/WelcomeLogin/hooks/__tests__/useSignInRedirect.test.ts`
Expected: The two new cases FAIL — the hook does not yet read `?redirect`.

- [ ] **Step 4: Update `useSignInRedirect`**

Replace `useSignInRedirect.ts` contents (preserving existing imports, types, and the `RtkError`/`hasNotFoundSpaces` helper) with:

```ts
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsOidcLoginPending } from '@/store/authSlice'
import { getSafeRedirectTarget } from '@/hooks/useSpaceIdSync/getSafeRedirectTarget'
import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

type RtkError = FetchBaseQueryError | SerializedError

type UseSignInRedirectProps = {
  spacesAmount: number
  inviteAmount: number
  isSpacesLoading: boolean
  error: RtkError | undefined
}

const hasNotFoundSpaces = (error?: RtkError) => {
  return error && 'status' in error && error.status === 404
}

export const useSignInRedirect = ({ spacesAmount, inviteAmount, isSpacesLoading, error }: UseSignInRedirectProps) => {
  const [hasSignedIn, setHasSignedIn] = useState(false)
  const router = useRouter()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const isOidcLoginPending = useAppSelector(selectIsOidcLoginPending)
  const [redirectLoading, setRedirectLoading] = useState(false)

  useEffect(() => {
    if (isUserSignedIn) {
      setHasSignedIn(true)
    }
  }, [isOidcLoginPending, isUserSignedIn])

  useEffect(() => {
    if (!hasSignedIn || !isUserSignedIn) return

    const redirectTarget = getSafeRedirectTarget(router.query.redirect)
    if (redirectTarget) {
      setRedirectLoading(true)
      router.push(redirectTarget)
      return
    }

    if (error && !hasNotFoundSpaces(error)) return

    const isNewUser = !inviteAmount && !isSpacesLoading && spacesAmount === 0
    if (isNewUser || hasNotFoundSpaces(error)) {
      setRedirectLoading(true)
      router.push({ pathname: AppRoutes.welcome.createSpace, query: router.query })
    }
  }, [hasSignedIn, isSpacesLoading, spacesAmount, inviteAmount, isUserSignedIn, error, router])

  return { setHasSignedIn, redirectLoading }
}
```

- [ ] **Step 5: Run tests to verify all pass**

Run: `yarn workspace @safe-global/web test apps/web/src/components/welcome/WelcomeLogin/hooks/__tests__/useSignInRedirect.test.ts`
Expected: PASS, including the two new cases and all pre-existing cases.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/welcome/WelcomeLogin/hooks/useSignInRedirect.ts apps/web/src/components/welcome/WelcomeLogin/hooks/__tests__/useSignInRedirect.test.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
feat: honor ?redirect param in useSignInRedirect

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Drop `setLastUsedSpace` from `AuthState`

**Files:**

- Modify: `apps/web/src/features/spaces/components/AuthState/index.tsx`
- Test: `apps/web/src/features/spaces/components/AuthState/index.test.tsx`

- [ ] **Step 1: Update the test to assert no dispatch**

Open `apps/web/src/features/spaces/components/AuthState/index.test.tsx` and remove any assertions of the form `expect(dispatch).toHaveBeenCalledWith(setLastUsedSpace(...))` and the `setLastUsedSpace` import. If a test was specifically about the dispatch, delete it. Keep all other Auth-state behavior tests intact.

- [ ] **Step 2: Run tests to verify they currently fail (or pass cleanly without the assertion)**

Run: `yarn workspace @safe-global/web test apps/web/src/features/spaces/components/AuthState/index.test.tsx`
Expected: If you deleted assertions only, tests PASS but the component still dispatches. If you also stubbed the dispatch in a `jest.fn()` and asserted it was NOT called, the test FAILS until step 3.

- [ ] **Step 3: Remove the dispatch from `AuthState`**

Edit `apps/web/src/features/spaces/components/AuthState/index.tsx`:

- Remove the `useEffect` that dispatches `setLastUsedSpace(spaceId)`.
- Remove `useAppDispatch` and `setLastUsedSpace` imports if they become unused.
- Remove the `useEffect` import if it becomes unused.

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn workspace @safe-global/web test apps/web/src/features/spaces/components/AuthState/index.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/features/spaces/components/AuthState/
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
refactor: drop setLastUsedSpace dispatch from AuthState

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Drop `setLastUsedSpace` from `useSpaceSubmit`

**Files:**

- Modify: `apps/web/src/features/spaces/components/CreateSpaceOnboarding/hooks/useSpaceSubmit.ts`
- Test: `apps/web/src/features/spaces/components/CreateSpaceOnboarding/hooks/useSpaceSubmit.test.ts`

- [ ] **Step 1: Update the test**

Remove any assertions checking that `setLastUsedSpace` was dispatched. Remove the import. Keep assertions about other state changes (notification, navigation, mutation).

- [ ] **Step 2: Update `useSpaceSubmit.ts`**

Remove the `dispatch(setLastUsedSpace(newSpaceId))` line and the `setLastUsedSpace` import. Leave `useAppDispatch` if still used for `showNotification`.

- [ ] **Step 3: Run tests**

Run: `yarn workspace @safe-global/web test apps/web/src/features/spaces/components/CreateSpaceOnboarding/hooks/useSpaceSubmit.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/spaces/components/CreateSpaceOnboarding/hooks/
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
refactor: drop setLastUsedSpace dispatch from useSpaceSubmit

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Drop `setLastUsedSpace` from `useOnboardingNavigation`

**Files:**

- Modify: `apps/web/src/features/spaces/components/SelectSafesOnboarding/hooks/useOnboardingNavigation.ts`

- [ ] **Step 1: Update the hook**

Open the file. Remove:

- the `useEffect` block that dispatches `setLastUsedSpace(spaceId)` when `spaceId` is present
- the `useAppDispatch` and `setLastUsedSpace` imports
- the `dispatch` local if unused

Keep the redirect-to-createSpace effect intact.

- [ ] **Step 2: Run any colocated tests (if present)**

Run: `yarn workspace @safe-global/web test apps/web/src/features/spaces/components/SelectSafesOnboarding/`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/features/spaces/components/SelectSafesOnboarding/hooks/useOnboardingNavigation.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
refactor: drop setLastUsedSpace dispatch from useOnboardingNavigation

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Simplify `useCurrentSpaceId` (URL-only)

**Files:**

- Modify: `apps/web/src/features/spaces/hooks/useCurrentSpaceId.ts`

- [ ] **Step 1: Find existing tests for this hook (if any)**

Run: `find apps/web/src/features/spaces -name "useCurrentSpaceId.test.ts*"`. If a test exists, read it. Update assertions to drop any Redux `lastUsedSpace` setup (it'll be deleted next task).

- [ ] **Step 2: Replace the hook body**

Overwrite `apps/web/src/features/spaces/hooks/useCurrentSpaceId.ts`:

```ts
import { useRouter } from 'next/router'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/**
 * Returns the current space ID from the URL `spaceId` query param, falling back
 * to the user's first space if the URL has not yet been populated by useSpaceIdSync.
 * The URL is the single source of truth.
 */
export const useCurrentSpaceId = (): string | null => {
  const { query } = useRouter()
  const isSiweAuthenticated = useAppSelector(isAuthenticated)
  const { data: spaces } = useSpacesGetV1Query(undefined, { skip: !isSiweAuthenticated })

  const rawSpaceId = query.spaceId
  const querySpaceId = typeof rawSpaceId === 'string' && rawSpaceId.length > 0 ? rawSpaceId : null
  const firstSpaceId = spaces?.[0] ? String(spaces[0].id) : null

  return querySpaceId || firstSpaceId
}
```

- [ ] **Step 3: Type-check and run any colocated tests**

Run: `yarn workspace @safe-global/web type-check`
Expected: PASS. (`lastUsedSpace` is no longer imported here, so dependents that haven't been cleaned yet may still reference it — that's OK; the slice itself still exports it until Task 13.)

Run: `yarn workspace @safe-global/web test apps/web/src/features/spaces/hooks/`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/features/spaces/hooks/useCurrentSpaceId.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
refactor: make useCurrentSpaceId URL-only

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Simplify `useIsSpaceRoute` (pathname-only)

**Files:**

- Modify: `apps/web/src/hooks/useIsSpaceRoute.ts`
- Test: `apps/web/src/hooks/__tests__/useIsSpaceRoute.test.ts` (already in tree from prototype)

- [ ] **Step 1: Confirm the existing test file matches what the spec wants**

Read `apps/web/src/hooks/__tests__/useIsSpaceRoute.test.ts`. It should test pathname-only behavior (no Redux). If it's already correct from the prototype, leave it.

- [ ] **Step 2: Replace the hook body**

Overwrite `apps/web/src/hooks/useIsSpaceRoute.ts`:

```ts
import { usePathname } from 'next/navigation'
import { AppRoutes } from '@/config/routes'

const SPACES_ROUTES: string[] = [
  AppRoutes.spaces.index,
  AppRoutes.spaces.settings,
  AppRoutes.spaces.members,
  AppRoutes.spaces.safeAccounts,
  AppRoutes.spaces.addressBook,
]

export const useIsSpaceRoute = (): boolean => {
  const route = usePathname() || ''
  return SPACES_ROUTES.includes(route)
}
```

- [ ] **Step 3: Run tests**

Run: `yarn workspace @safe-global/web test apps/web/src/hooks/__tests__/useIsSpaceRoute.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/useIsSpaceRoute.ts apps/web/src/hooks/__tests__/useIsSpaceRoute.test.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
refactor: drop Redux dependency from useIsSpaceRoute

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Remove `lastUsedSpace` from `authSlice`

**Files:**

- Modify: `apps/web/src/store/authSlice.ts`
- Test: `apps/web/src/store/__tests__/authSlice.test.ts`

- [ ] **Step 1: Find any remaining importers**

Run: `grep -rn "lastUsedSpace\|setLastUsedSpace" apps/web/src`
Expected: only `authSlice.ts` and `authSlice.test.ts` should show matches. If anything else does, complete that file first before continuing this task.

- [ ] **Step 2: Update the slice test**

Open `apps/web/src/store/__tests__/authSlice.test.ts`. Delete all tests that exercise the `lastUsedSpace` field or `setLastUsedSpace` action. Remove the `setLastUsedSpace` import. Keep all other auth slice tests.

- [ ] **Step 3: Surgically edit `authSlice.ts`**

Do NOT rewrite the file from scratch — the slice has reducers, extraReducers, and selectors beyond what's listed in this plan. Make exactly these targeted edits:

1. From the `AuthPayload` type, delete the line `lastUsedSpace: string | null`.
2. From the `initialState` object, delete the line `lastUsedSpace: null,`.
3. From the slice's `reducers`, delete the `setLastUsedSpace` reducer in full.
4. From the action destructuring (`export const { ... } = authSlice.actions`), remove `setLastUsedSpace`.
5. Delete the `lastUsedSpace` selector export in full:
   ```ts
   export const lastUsedSpace = (state: RootState) => {
     return state.auth.lastUsedSpace
   }
   ```
6. Leave everything else (`setAuthenticated`, `setUnauthenticated`, `setIsOidcLoginPending`, `isAuthenticated`, `selectIsStoreHydrated`, `selectIsOidcLoginPending`, any `extraReducers`, etc.) untouched.

After editing, run `git diff -- apps/web/src/store/authSlice.ts` and visually confirm only `lastUsedSpace`-related lines are gone.

- [ ] **Step 4: Type-check + run slice tests + grep**

Run: `yarn workspace @safe-global/web type-check`
Expected: PASS.

Run: `yarn workspace @safe-global/web test apps/web/src/store/__tests__/authSlice.test.ts`
Expected: PASS.

Run: `grep -rn "lastUsedSpace\|setLastUsedSpace" apps/web/src`
Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/store/authSlice.ts apps/web/src/store/__tests__/authSlice.test.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
refactor: remove lastUsedSpace from authSlice

URL ?spaceId is now the single source of truth.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Update Storybook mocks and stories

**Files:**

- Modify: `apps/web/src/stories/mocks/defaults.ts`
- Modify: `apps/web/src/features/spaces/components/Sidebar/SafeSidebar.stories.tsx`

- [ ] **Step 1: Remove `lastUsedSpace` from default mocks**

Open `apps/web/src/stories/mocks/defaults.ts` and any story that references `lastUsedSpace` in initial Redux state. Drop the field. (The uncommitted prototype already touches these — verify with `git diff HEAD -- apps/web/src/stories`.)

- [ ] **Step 2: Type-check**

Run: `yarn workspace @safe-global/web type-check`
Expected: PASS.

- [ ] **Step 3: Smoke-test the affected stories**

Run: `yarn workspace @safe-global/web storybook` in one terminal. In another, verify the SafeSidebar story still renders. (If Storybook is already broken on `dev`, skip and note it; this plan does not own that fix.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stories/ apps/web/src/features/spaces/components/Sidebar/SafeSidebar.stories.tsx
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
chore: drop lastUsedSpace from storybook mocks

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Mount `useSpaceIdSync` in `InitApp`

**Files:**

- Modify: `apps/web/src/pages/_app.tsx`

- [ ] **Step 1: Add the mount**

In `apps/web/src/pages/_app.tsx`, add the import near the other `useXxx` imports inside `InitApp`:

```ts
import { useSpaceIdSync } from '@/hooks/useSpaceIdSync'
```

And inside the `InitApp` function body, add the call alongside the other init hooks (after `useLogoutCallback()` is a fine placement):

```ts
useSpaceIdSync()
```

- [ ] **Step 2: Type-check**

Run: `yarn workspace @safe-global/web type-check`
Expected: PASS.

- [ ] **Step 3: Manual browser smoke test**

Run: `yarn workspace @safe-global/web dev`

In a browser:

1. Navigate to `/home` while signed out → page renders classic UI, no redirect.
2. Navigate to `/home?spaceId=1` while signed out → redirected to `/welcome/spaces?redirect=%2Fhome%3FspaceId%3D1`.
3. Sign in via SIWE with an account that has at least one space → returned to `/home?spaceId=<your-space>`.
4. Navigate to `/home` while signed in → URL updates to `/home?spaceId=<first-space>` (no remount; check React DevTools).
5. Navigate to `/spaces` while signed in → no `?spaceId` injection issue (already on /spaces).
6. Navigate to `/imprint` while signed in → no `?spaceId` added.

If any step fails, fix before committing.

- [ ] **Step 4: Run the full changed-files verify**

Run: `yarn verify:changed:web`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/_app.tsx
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
feat: mount useSpaceIdSync in InitApp

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Cypress E2E — sign-in-with-redirect happy path

**Files:**

- Create: `apps/web/cypress/e2e/spaces/spaceid-redirect.cy.ts`

- [ ] **Step 1: Confirm Cypress patterns and selectors**

Read `apps/web/cypress/AGENTS.md` and one existing spaces E2E test (e.g. `apps/web/cypress/e2e/spaces/spaces_setup.cy.ts` if it exists, else any test under `apps/web/cypress/e2e/spaces/`) to mirror the Page Object Model conventions used.

- [ ] **Step 2: Write the failing E2E test**

Create `apps/web/cypress/e2e/spaces/spaceid-redirect.cy.ts` following the project's POM conventions. The test must cover:

1. Visit `/home?spaceId=<known-space>` while not signed in.
2. Assert the URL becomes `/welcome/spaces?redirect=%2Fhome%3FspaceId%3D...` (or whatever encoding Next uses).
3. Sign in (use whichever sign-in helper exists in the suite — `cy.signInWith…`).
4. Assert the final URL is `/home?spaceId=<known-space>`.

Use the actual selectors and helpers from the existing tests rather than improvising. Don't add new helpers as part of this task; if a helper is missing, document the gap in the PR description rather than scope-creeping the plan.

- [ ] **Step 3: Run the test against a local dev server**

Run the project's standard Cypress smoke command (`yarn workspace @safe-global/web cypress:open` interactively, or the headless equivalent your env uses).
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/cypress/e2e/spaces/spaceid-redirect.cy.ts
git -c commit.gpgsign=true commit -S -m "$(cat <<'EOF'
tests: add e2e for spaceId redirect-and-return happy path

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] **Run full verify**

Run: `yarn verify:web`
Expected: type-check, lint, prettier, tests all PASS.

- [ ] **Confirm clean grep**

Run: `grep -rn "lastUsedSpace\|setLastUsedSpace" apps/web/src`
Expected: no matches.

- [ ] **Confirm flag wiring**

Run: `grep -rn "DISABLE_SPACES_LOGIN\|DISABLE_CLASSIC_UI" apps/web/src packages/utils/src`
Expected: matches in `packages/utils/src/utils/chains.ts`, `apps/web/src/hooks/useSpaceIdSync/index.ts`, and the test files only.

---

## Risks / things this plan deliberately doesn't do

- **Does not remove classic UI** — that's a follow-up cleanup PR after the 1-month window.
- **Does not touch mobile** — out of scope per the spec.
- **Does not migrate `localStorage`** — the leftover `lastUsedSpace` value in users' persisted store will be dropped on the next save once nothing reads it. No explicit redux-persist migration is needed.
- **Does not add a Storybook story** for `useSpaceIdSync` (the apps/web/AGENTS.md story requirement is for components, not hooks).
- **Cypress test assumes** a sign-in helper exists in the existing spaces test suite. If it doesn't, the implementer should note that as a follow-up rather than build one inside this PR.
- **Tests use Jest spies on RTK Query hooks** (`spacesApi.useSpacesGetV1Query`). This is the existing project pattern for unit-testing components that depend on RTK Query. If you'd prefer MSW + an integration-style test, that's a refactor outside this plan's scope.

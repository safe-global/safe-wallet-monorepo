# Gateway Hooks And Session State

Use these examples when changing CGW client hooks, auth/session state, or
logout/session-expiry behavior.

## hydration-aware-effects

Use this when an effect reads auth state that can be rehydrated from persisted
Redux state.

Prefer:

```ts
useEffect(() => {
  if (!isStoreHydrated) return
  if (isExpired(sessionExpiresAt)) {
    dispatch(sessionExpired())
  }
}, [dispatch, isStoreHydrated, sessionExpiresAt])
```

Avoid:

```ts
useEffect(() => {
  if (isExpired(sessionExpiresAt)) {
    dispatch(sessionExpired())
  }
}, [])
```

Why:

The mount closure can capture initial empty auth state before hydration and
never observe the persisted expired session.

## logout-session-races

Use this when logout navigates through a full-page redirect while global
credentialed-response hooks are active.

Prefer:

```ts
const logout = () => {
  dispatch(setUnauthenticated())
  sessionStorage.setItem(LOGGING_OUT_KEY, '1')
  form.submit()
}
```

Avoid:

```ts
const logout = () => {
  sessionStorage.setItem(LOGGING_OUT_KEY, '1')
  form.submit()
}
```

Why:

After backend logout clears the cookie, hydrated client auth can still look
valid long enough for credentialed queries to 403 and show a misleading
session-expired toast.

## idempotent-response-hooks

Use this when an initializer registers a global response hook.

Prefer:

```ts
let deregister: (() => void) | null = null

export const initializeGatewayHook = () => {
  deregister?.()
  deregister = addHandleResponseHook(handleResponse)
}
```

Also acceptable:

```ts
let initialized = false

export const initializeGatewayHook = () => {
  if (initialized) return
  initialized = true
  addHandleResponseHook(handleResponse)
}
```

Avoid:

```ts
export const initializeGatewayHook = () => {
  addHandleResponseHook(handleResponse)
}
```

Why:

Setter-style APIs were implicitly idempotent. Append-style hook APIs accumulate
callbacks across repeated initialization unless callers guard or deregister.

## fresh-auth-probes

Use this when login/logout callbacks need to reconcile backend cookie state.

Prefer:

```ts
const result = await dispatch(
  authGetMeV1.initiate(undefined, {
    forceRefetch: true,
    subscribe: false,
  }),
)
```

Avoid:

```ts
const result = await dispatch(authGetMeV1.initiate())
```

Why:

Auth transitions are about current backend cookie state. Cached RTK Query data
can keep a previous authenticated result alive after logout or before a new
login is fully established.

## WEB-05 — Trigger redirect endpoints via top-level navigation

Source: PR #7560 (RL-20260407-003)

### Avoid

```ts
try {
  const redirectUrl = new URL(AppRoutes.welcome.spaces, window.location.origin).toString()
  await entityLogoutWithRedirect({
    logoutDto: { redirect_url: redirectUrl },
  })
  dispatch(setUnauthenticated())
} catch {
  logError(Errors._109)
}
```

### Prefer

```ts
const redirectUrl = new URL(AppRoutes.welcome.spaces, window.location.origin).toString()
const form = document.createElement('form')
form.method = 'POST'
form.action = `${GATEWAY_URL}/v1/auth/logout/redirect`
const input = document.createElement('input')
input.name = 'redirect_url'
input.value = redirectUrl
form.appendChild(input)
document.body.appendChild(form)
sessionStorage.setItem(LOGGING_OUT_KEY, '1')
form.submit()
// Do not remove the form synchronously — let the navigation start first.
```

### Why

Endpoints that return a 303 to clear an upstream IdP session must be reached
through a top-level browser navigation. Calling them via fetch/RTK Query
returns 200 to the SPA but never propagates the IdP-side session clear, so
OIDC users get auto-signed-in on the next attempt. Removing the form
synchronously can also cancel the POST before it reaches the gateway.

## WEB-03 — Force unauthenticated on transient reconcile errors

Source: PR #7560 (RL-20260407-005)

### Avoid

```ts
const result = await reconcileAuth(dispatch)

if (result === 'error' || result === 'authenticated') {
  logError(Errors._109)
}
sessionStorage.removeItem(LOGGING_OUT_KEY)
```

### Prefer

```ts
const result = await reconcileAuth(dispatch)

if (result !== 'unauthenticated') {
  logError(Errors._109)
}

if (result === 'error' || result === 'authenticated') {
  dispatch(setUnauthenticated())
}
sessionStorage.removeItem(LOGGING_OUT_KEY)
```

### Why

If the post-logout reconciliation request fails transiently (5xx, network),
only logging the error and clearing the in-progress flag leaves Redux marked
authenticated forever; route guards then keep the UI in a signed-in state
with no retry. Treat a transient reconcile error the same as the
`authenticated` outcome on the deliberate-logout path: force the user to
unauthenticated so they re-login.

## RTK-01 — Unwrap mutations before mutating state on success

Source: PR #7560 (RL-20260407-004)

### Avoid

```ts
await entityApi.endpoints.processFn.initiate(args)
dispatch(setEntityProcessed())
```

### Prefer

```ts
try {
  await entityApi.endpoints.processFn.initiate(args).unwrap()
  dispatch(setEntityProcessed())
} catch {
  logError(Errors._109)
}
```

### Why

Awaiting an RTK Query mutation does not throw on HTTP/API failures unless
`.unwrap()` is used. Without it, the success-path `dispatch` runs even when
the backend rejected the request, desynchronising client state from server
state and skipping the `catch` branch that would surface or recover from the
failure.

## WEB-07 — Handle the loading tri-state of feature flags

Source: PR #7884, #7889 (RL-20260522-001, RL-20260521-001)

### Avoid

```ts
const isGateEnabled = useIsResourceGateEnabled() ?? false // undefined while config loads → treated as OFF

// fires on first mount before the flag resolves: drops ?next=, flashes wrong UI
if (isGateEnabled) router.replace(loginPath)
// an opt-in escape hatch that ignores auth state keeps bypassing the gate after sign-in
if (isOptedOut) return false
```

### Prefer

```ts
const gate = useIsResourceGateEnabled() // boolean | undefined

if (gate === undefined) return null // still resolving — wait / allow until known
if (isOptedOut && !isAuthenticated) return false // opt-out scoped to signed-out only
if (gate === true && !isAuthenticated) router.replace(withNext(loginPath))
```

### Why

A flag hook that is `undefined` while its source loads must not be coerced to a hard `false`. Coercion makes routing, `return null` loaders, and gating decisions fire before the value is known — losing the destination URL, flashing the pre-gate screen, or letting a stale opt-in bypass the gate after sign-in. Branch on `=== true`/`=== false` and treat `undefined` as "wait".

## CODE-06 — Await or catch fire-and-forget async

Source: PR #7819, #7886 (RL-20260522-002)

### Avoid

```ts
const onFinish = async () => {
  await submit(payload).unwrap() // rejects → unhandled promise rejection
  router.push(next)
}
;<Button onClick={onFinish} /> // fire-and-forget

cleanup() // un-awaited; rejection escapes
```

### Prefer

```ts
const onFinish = async () => {
  try {
    await submit(payload).unwrap()
    router.push(next)
  } catch {
    // error state already drives the visible alert
  }
}

void (async () => {
  try {
    await cleanup()
  } catch (e) {
    Logger.warn('cleanup failed', e)
  }
})()
```

### Why

An `onClick={asyncFn}` handler and an un-awaited cleanup call both let a rejected promise escape as an unhandled rejection (console + Sentry noise), even when a user-facing error alert already renders. Await inside `try/catch`, or wrap in an awaited IIFE that logs the rejection, so the handled error state is the only surfaced path.

## RTK-04 — Scope cache tags per id

Source: PR #7960, #7935 (RL-20260601-001)

### Avoid

```ts
// every overview query across all chains/safes is invalidated on any tx success
getSafeOverview: build.query({ providesTags: ['SafeOverviews'] })
dispatch(api.util.invalidateTags(['SafeOverviews']))
```

### Prefer

```ts
getSafeOverview: build.query({
  providesTags: (_r, _e, { chainId, address }) => [
    { type: 'SafeOverviews', id: makeSafeOverviewTag(chainId, address) },
  ],
})
dispatch(api.util.invalidateTags([{ type: 'SafeOverviews', id: makeSafeOverviewTag(chainId, address) }]))
```

### Why

A bare `['SafeOverviews']` tag matches every query of that type, so one mutation refetches all of them — a refetch storm that scales with the number of mounted safes/spaces. Carry an `id` derived from the entity (chain + address, or `spaceId:slug`) so invalidation hits only the affected query.

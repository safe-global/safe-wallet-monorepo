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

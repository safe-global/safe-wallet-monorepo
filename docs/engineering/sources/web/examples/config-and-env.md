# Config and Env

Use these examples when introducing or changing env-var-driven config (origin
allowlists, CORS hosts, redirect allowlists, feature URLs).

## CONFIG-01 — Match env-var defaults to consumer parsers

Source: PR #7459 (RL-20260326-005)

### Avoid

```ts
export const SUPPORT_CHAT_ALIAS_DOMAIN = process.env.NEXT_PUBLIC_SUPPORT_CHAT_ALIAS_DOMAIN || 'anon.safe.global'
export const SUPPORT_CHAT_URL = process.env.NEXT_PUBLIC_PYLON_CHAT_URL || 'https://safe-support.vercel.app/chat'
export const SUPPORT_CHAT_ENABLED = process.env.NEXT_PUBLIC_SHOW_SUPPORT_CHAT === 'true'
export const SUPPORT_CHAT_ALLOWED_PARENTS =
  process.env.NEXT_PUBLIC_SUPPORT_CHAT_ALLOWED_PARENTS ||
  'http://localhost https://app.safe.global https://safe-support.vercel.app/'
```

### Prefer

```ts
export const SUPPORT_CHAT_ALIAS_DOMAIN = process.env.NEXT_PUBLIC_SUPPORT_CHAT_ALIAS_DOMAIN || 'anon.safe.global'
export const SUPPORT_CHAT_URL = process.env.NEXT_PUBLIC_PYLON_CHAT_URL || 'https://safe-support.vercel.app/chat'
export const SUPPORT_CHAT_ENABLED = process.env.NEXT_PUBLIC_SHOW_SUPPORT_CHAT === 'true'
export const SUPPORT_CHAT_ALLOWED_PARENTS =
  process.env.NEXT_PUBLIC_SUPPORT_CHAT_ALLOWED_PARENTS ||
  'http://localhost https://app.safe.global https://safe-support.vercel.app'
```

### Why

Browser-supplied origins (e.g. `event.origin`, `window.location.origin`) are
always slashless — `https://safe-support.vercel.app`, never with a trailing
`/`. When the env-var default carries a trailing slash, strict equality checks
in the consumer (`useSupportChat` parses the space-separated list and compares
each entry against the incoming origin) silently reject legitimate parents
even when the env var is unset. Keep the default in the exact shape the
consumer parses: no trailing slash on origin entries.

---
module: Web
date: 2026-06-02
problem_type: architecture_migration
component: pwa_service_worker_sri
symptoms:
  - 'apps/web-tanstack shipped no service worker, no precache, no offline fallback, no SRI'
  - 'Stale sw.js / workbox-*.js / firebase-messaging-sw.js copied into dist from apps/web/public'
  - 'Background push silently broken (regression #7568) since knip removed the FCM worker (PR #7022)'
  - 'Legacy webpack-runtime SRI patch has no Vite equivalent for native import() chunks'
root_cause: framework_migration_gap
resolution_type: feature_reconstruction
severity: high
tags: [tanstack, vite, pwa, service-worker, workbox, firebase, fcm, sri, import-map, web]
---

# TanStack (Vite) PWA, Service Worker, and SRI — Phase 6

How `apps/web-tanstack` regained the PWA / service-worker / SRI behaviour that
`apps/web` had under next-pwa + a webpack-runtime SRI patch. Captured because
several of the legacy mechanisms do not port, and the publicDir setup has sharp
edges.

## What was built

- **Single Vite worker** (`src/service-worker/sw.ts`) via `vite-plugin-pwa`
  `injectManifest`: Workbox precache + `CacheFirst` for static assets (1y / 1000
  entries, parity with legacy `runtimeCaching`) + `setCatchHandler` →
  `matchPrecache('offline.html')` for cold offline navigations.
- **FCM merged into the same worker** (restores #7568) — never a second
  `firebase-messaging-sw.js`.
- **SRI via native import-map integrity** (`plugins/vite-plugin-import-map-integrity.ts`)
  - a CI re-hash assertion (`scripts/assert-sri.mjs`).

## Gotchas

### 1. `publicDir` points at the _legacy_ app's public folder

`vite.config.ts` sets `publicDir: apps/web/public`, which Vite copies verbatim
into `dist`. That folder contains a **git-tracked 0-byte `firebase-messaging-sw.js`
stub** plus (locally) stale `sw.js` / `workbox-*.js` from a previous `apps/web`
build. Vite supports only one public dir, so:

- `offline.html` is **emitted from source** in a `generateBundle` hook, not placed
  in a public dir.
- A `closeBundle` cleanup (ordered **after** `VitePWA`) deletes the stale
  `firebase-messaging-sw.js` and any `workbox-*.js` from `dist`.
- `injectManifest.globIgnores` excludes those same files so they never enter the
  precache manifest.

In injectManifest mode the Workbox runtime is **bundled into `sw.js`**, so any
separate `workbox-*.js` in `dist` is always stale.

### 2. The deleted FCM worker had a cascade of deleted helpers

knip (PR #7022, regression #7568) removed not just the worker entry but also
`isWebhookEvent` (webhook-types.ts), `getNotificationTrackingKey` +
`cacheServiceWorkerPushNotificationTrackingEvent` (tracking.ts), and
`shouldShowServiceWorkerPushNotification` + `parseServiceWorkerPushNotification`
(notifications.ts). All were recovered from `git show d24c057e4^` and restored to
their original `apps/web/src` locations (the post-cut-over home). Because knip
(scoped to `@safe-global/web`) can't see the cross-workspace web-tanstack
consumer, those three files are added to `apps/web/knip.json` `ignore` with a
`// see #7568` comment.

### 3. Native SRI does not cover `import()` — use import maps, not tag attributes

The legacy `SriManifestWebpackPlugin` patched the **webpack runtime** to add an
`integrity` attribute to dynamically-injected `<script>` tags. Vite loads
code-split chunks via native `import()`, which no DOM-tag rewrite can protect, so
tag-only SRI plugins (`sri3`, `@small-tech`) would leave most of the app
unprotected. The web-platform answer is **`integrity` in an import map**
(Chrome 127+, Safari 18+, Firefox 138+), which the engine enforces for static
imports, transitive deps, and lazy `import()`.

The plugin hashes **final** chunk bytes in a `generateBundle` `order: 'post'` hook
(after minification / any compression), never rewrites chunk bytes (sourcemaps +
Datadog upload stay intact), and injects the import map as the **first `<head>`
child** so it precedes any module load. Vite already emits `crossorigin` on its
module scripts; the plugin only adds `crossorigin` when absent to avoid a
duplicate attribute.

### 4. Dev vs prod worker divergence

The SRI plugin and the manifest only exist in **production builds**. Always
validate offline / precache / SRI against `vite preview` (or the CI build), never
`vite dev`.

### 5. Single registration only

`PwaReloadPrompt` (`useRegisterSW` from `virtual:pwa-register/react`) performs the
**single** registration, so `injectRegister` is `false` in the VitePWA config —
otherwise an auto-injected script double-registers. The push client
(`PushNotifications/logic.ts`) reuses `navigator.serviceWorker.getRegistrations()[0]`,
which now resolves to our one worker. Registering a second
`firebase-messaging-sw.js` triggers the documented vite-plugin-pwa #777 reload
loop.

## Follow-ups (deferred)

- In-browser byte-tamper E2E (needs a `vite preview` serving harness + gating on
  import-map-integrity-supporting browsers). Build-time `assert-sri.mjs` covers
  tamper detection in CI today.
- `es-module-shims` (shim mode) for browsers below the native-support floor, or an
  explicit native-only decision per analytics.
- Rewriting `apps/web/AGENTS.md`'s PWA/SW/SRI guidance to the Vite model belongs
  with the cut-over (apps/web is still next-pwa until then).
- Wiring SRI into a real prod/IPFS deploy belongs with the parent plan's Phase 8/9
  (no web-tanstack deploy pipeline exists yet).

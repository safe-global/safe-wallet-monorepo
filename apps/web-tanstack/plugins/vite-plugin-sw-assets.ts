import { readFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/**
 * Two build-time concerns for the single Vite service worker, kept together
 * because they both bracket the vite-plugin-pwa lifecycle:
 *
 * 1. Emit `offline.html` into the bundle. `publicDir` points at the legacy
 *    `apps/web/public`, and Vite supports only one public dir, so the offline
 *    shell is emitted from source instead of copied. Emitting in
 *    `generateBundle` guarantees it is on disk before vite-plugin-pwa computes
 *    its precache manifest in `closeBundle`.
 *
 * 2. Remove stale service-worker artifacts that `publicDir` copies verbatim
 *    from `apps/web/public` (R-PUBLICDIR): the tracked 0-byte
 *    `firebase-messaging-sw.js` stub and any leftover `workbox-*.js` from a
 *    local `apps/web` build. In injectManifest mode the Workbox runtime is
 *    bundled into `sw.js`, so a separate `workbox-*.js` is always stale. This
 *    runs in `closeBundle`; the plugin must be ordered AFTER `VitePWA` so the
 *    generated `sw.js` already exists.
 */
export function swAssets(offlineHtmlPath: string): Plugin {
  let outDir = 'dist'

  return {
    name: 'web-tanstack-sw-assets',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'offline.html',
        source: readFileSync(offlineHtmlPath, 'utf-8'),
      })
    },
    closeBundle() {
      const removed: string[] = []

      const remove = (fileName: string) => {
        const target = path.join(outDir, fileName)
        if (existsSync(target)) {
          rmSync(target, { force: true })
          removed.push(fileName)
        }
      }

      // The single worker is `sw.js`; the FCM logic is merged into it. The
      // legacy `firebase-messaging-sw.js` must never ship (it would shadow our
      // worker / trigger the dual-SW reload loop).
      remove('firebase-messaging-sw.js')
      remove('firebase-messaging-sw.js.map')

      // injectManifest bundles Workbox into `sw.js`; any `workbox-*.js` in the
      // output is a stale copy from `apps/web/public`.
      if (existsSync(outDir)) {
        for (const entry of readdirSync(outDir)) {
          if (/^workbox-.*\.js(\.map)?$/.test(entry)) {
            remove(entry)
          }
        }
      }

      if (removed.length > 0) {
        this.info(`Removed stale service-worker artifacts: ${removed.join(', ')}`)
      }
    },
  }
}

import { readFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

// `publicDir` points at the legacy apps/web/public and Vite allows only one, so
// the offline shell is emitted from source rather than copied, and stale service
// workers that apps/web/public carries (the 0-byte firebase-messaging-sw.js stub,
// leftover workbox-*.js from a local apps/web build) are deleted from the output.
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

      remove('firebase-messaging-sw.js')
      remove('firebase-messaging-sw.js.map')

      // injectManifest bundles Workbox into sw.js, so any workbox-*.js is stale.
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

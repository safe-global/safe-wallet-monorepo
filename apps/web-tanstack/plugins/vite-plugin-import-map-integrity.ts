import { createHash } from 'node:crypto'
import type { Plugin } from 'vite'

/**
 * Subresource Integrity for the Vite build (Phase 6C, Decision 3 / D3-a).
 *
 * Legacy `apps/web` protected dynamically-loaded chunks by patching the webpack
 * runtime — a mechanism Vite has no equivalent for, since Vite loads code-split
 * chunks via native `import()`. The web-platform replacement is **integrity in
 * import maps** (Chrome 127+, Safari 18+, Firefox 138+), which the browser
 * engine enforces for static imports, transitive deps, and lazy `import()`.
 *
 * This plugin, in a post-order `generateBundle` (so it sees the FINAL bytes of
 * every chunk, after minification / any compression plugin):
 *   1. sha384-hashes every emitted `.js` chunk and `.css` asset,
 *   2. injects a `<script type="importmap">` carrying the JS `integrity` map,
 *   3. adds `integrity` + `crossorigin` to the static entry `<script>`,
 *      `modulepreload` `<link>`s, and stylesheet `<link>`s in `index.html`,
 *   4. emits `sri-manifest.json` as the source of truth for the CI re-hash
 *      assertion.
 *
 * It NEVER rewrites chunk bytes, so sourcemaps (and the Datadog upload) stay
 * intact.
 */
const sri = (content: string | Uint8Array): string => `sha384-${createHash('sha384').update(content).digest('base64')}`

const injectIntegrity = (html: string, integrity: Record<string, string>): string => {
  // Add integrity (+ crossorigin) to every <script>/<link> whose src/href is a
  // hashed asset. Module scripts and modulepreload links are always fetched in
  // CORS mode, so SRI is enforced even same-origin.
  let out = html.replace(/<(?:script|link)\b[^>]*>/g, (tag) => {
    const ref = tag.match(/\b(?:src|href)="([^"]+)"/)
    const hash = ref && integrity[ref[1]]
    if (!hash) {
      return tag
    }
    let next = tag
    if (!/\bintegrity=/.test(next)) {
      next = next.replace(/\s*\/?>$/, (end) => ` integrity="${hash}"${end}`)
    }
    if (!/\bcrossorigin/.test(next)) {
      next = next.replace(/\s*\/?>$/, (end) => ` crossorigin="anonymous"${end}`)
    }
    return next
  })

  // The import map must precede the first module load, so inject it as the very
  // first <head> child. Only JS modules belong in the integrity map.
  const jsIntegrity = Object.fromEntries(Object.entries(integrity).filter(([url]) => url.endsWith('.js')))
  const importMap = `<script type="importmap">${JSON.stringify({ imports: {}, integrity: jsIntegrity })}</script>`
  out = out.replace(/<head>/, `<head>${importMap}`)

  return out
}

export function importMapIntegrity(): Plugin {
  let base = '/'

  return {
    name: 'web-tanstack-import-map-integrity',
    apply: 'build',
    configResolved(config) {
      base = config.base || '/'
    },
    generateBundle: {
      // Run after any plugin that mutates chunk bytes (compression, etc.).
      order: 'post',
      handler(_options, bundle) {
        const prefix = base.endsWith('/') ? base : `${base}/`
        const toUrl = (fileName: string) => `${prefix}${fileName}`

        const integrity: Record<string, string> = {}
        for (const file of Object.values(bundle)) {
          if (file.type === 'chunk' && file.fileName.endsWith('.js')) {
            integrity[toUrl(file.fileName)] = sri(file.code)
          } else if (file.type === 'asset' && file.fileName.endsWith('.css')) {
            const source = typeof file.source === 'string' ? file.source : Buffer.from(file.source)
            integrity[toUrl(file.fileName)] = sri(source)
          }
        }

        this.emitFile({
          type: 'asset',
          fileName: 'sri-manifest.json',
          source: JSON.stringify({ integrity }, null, 2),
        })

        const indexHtml = bundle['index.html']
        if (indexHtml && indexHtml.type === 'asset' && typeof indexHtml.source === 'string') {
          indexHtml.source = injectIntegrity(indexHtml.source, integrity)
        }
      },
    },
  }
}

// Exported for unit tests.
export const __test__ = { sri, injectIntegrity }

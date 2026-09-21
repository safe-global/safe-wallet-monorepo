import { createHash } from 'node:crypto'
import type { Plugin } from 'vite'

// Native SRI for the Vite build: integrity hashes live in an import map, which
// the browser enforces for static imports AND lazy `import()` chunks (a tag
// `integrity` attribute can't cover dynamic imports). Hashes are computed from
// final chunk bytes without rewriting them, so sourcemaps stay intact.
const sri = (content: string | Uint8Array): string => `sha384-${createHash('sha384').update(content).digest('base64')}`

const injectIntegrity = (html: string, integrity: Record<string, string>): string => {
  let out = html.replace(/<(?:script|link)\b[^>]*>/gi, (tag) => {
    const ref = tag.match(/\b(?:src|href)="([^"]+)"/i)
    const hash = ref && integrity[ref[1]]
    if (!hash) {
      return tag
    }
    let next = tag
    if (!/\bintegrity=/i.test(next)) {
      next = next.replace(/\s*\/?>$/, (end) => ` integrity="${hash}"${end}`)
    }
    if (!/\bcrossorigin/i.test(next)) {
      next = next.replace(/\s*\/?>$/, (end) => ` crossorigin="anonymous"${end}`)
    }
    return next
  })

  // The import map must precede the first module load, so it goes first in <head>.
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
      // 'post' so hashes reflect bytes after any chunk-mutating plugin (e.g. compression).
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

export const __test__ = { sri, injectIntegrity }

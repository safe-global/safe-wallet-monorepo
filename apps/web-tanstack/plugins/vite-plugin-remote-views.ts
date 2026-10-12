import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

// Swaps every sandboxed view module from @safe-global/views for its generated wrapper, as the Next build does
// (apps/web/plugins/remote-view-plugin.mjs). The mapping comes from apps/web/scripts/remote-view-generate.mjs.
export const remoteViews = (webRoot: string): Plugin => {
  const file = path.join(webRoot, 'src/remote-view/generated/modules.json')
  const modules = existsSync(file)
    ? new Map(
        Object.entries(JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>).map(([from, to]) => [
          path.resolve(from),
          to,
        ]),
      )
    : null
  return {
    name: 'safe-remote-views',
    enforce: 'pre',
    buildStart() {
      if (!modules) this.warn('remote-view: generated/modules.json is missing, views are not sandboxed.')
    },
    async resolveId(source, importer, options) {
      if (!modules) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (!resolved) return null
      const wrapper = modules.get(path.resolve(resolved.id.split('?')[0]))
      return wrapper ?? null
    },
  }
}

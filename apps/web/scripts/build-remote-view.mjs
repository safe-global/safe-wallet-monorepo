// Builds public/remote-view/frame.js: the sandboxed iframe launcher with the remote views worker inlined.
import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(root, '../src/remote-view/frame')

// Views import the real UI primitives; inside the worker they become remote elements the host draws.
const PRIMITIVES = {
  'components/ui/button': path.join(src, 'primitives/button.tsx'),
}

const primitivesPlugin = (viewsEntry) => ({
  name: 'remote-view-primitives',
  setup(builder) {
    for (const [request, file] of Object.entries(PRIMITIVES)) {
      builder.onResolve({ filter: new RegExp(`@safe-global/views/${request}$`) }, () => ({ path: file }))
    }
    if (viewsEntry) builder.onResolve({ filter: /^\.\/views$/ }, () => ({ path: viewsEntry }))
  },
})

export const buildFrame = async ({ out, viewsEntry, define = {}, production = true }) => {
  const common = {
    bundle: true,
    write: false,
    format: 'iife',
    minify: production,
    jsx: 'automatic',
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'), ...define },
  }
  const worker = await build({
    ...common,
    entryPoints: [path.join(src, 'worker.tsx')],
    plugins: [primitivesPlugin(viewsEntry)],
  })
  const frame = await build({
    ...common,
    entryPoints: [path.join(src, 'frame.ts')],
    define: { ...common.define, WORKER_SOURCE: JSON.stringify(worker.outputFiles[0].text) },
  })
  await mkdir(path.dirname(out), { recursive: true })
  await writeFile(out, frame.outputFiles[0].text)
  return frame.outputFiles[0].text.length
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = path.join(root, '../public/remote-view/frame.js')
  const size = await buildFrame({ out, production: process.env.NODE_ENV !== 'development' })
  console.log(`remote-view: wrote ${path.relative(process.cwd(), out)} (${size} bytes)`)
}

// Builds public/remote-view/frame.js: the sandboxed iframe launcher with the remote views worker inlined.
import { build } from 'esbuild'
import { transform as svgr } from '@svgr/core'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { generate } from './remote-view-generate.mjs'

const root = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(root, '../src/remote-view/frame')
const viewsSrc = path.join(root, '../../../packages/views/src')

// Primitives that need the real DOM; inside the worker they become remote elements the page draws.
const PRIMITIVES = {}

const RUNTIME = path.join(src, 'jsx-runtime.ts')
const REACT_SHIM = path.join(src, 'react-shim.js')
const OWN_REACT = new Set([RUNTIME, REACT_SHIM])

const workerPlugin = (viewsEntry) => ({
  name: 'remote-view-worker',
  setup(builder) {
    for (const [request, file] of Object.entries(PRIMITIVES)) {
      builder.onResolve({ filter: new RegExp(`@safe-global/views/${request}$`) }, () => ({ path: file }))
    }
    builder.onResolve({ filter: /^\.\/views$/ }, () => ({ path: viewsEntry }))
    // Every JSX call and createElement in the worker, including precompiled libraries, maps HTML tags to remote elements.
    builder.onResolve({ filter: /^react\/jsx-(dev-)?runtime$/ }, (args) =>
      OWN_REACT.has(args.importer) ? undefined : { path: RUNTIME },
    )
    builder.onResolve({ filter: /^react$/ }, (args) =>
      OWN_REACT.has(args.importer) ? undefined : { path: REACT_SHIM },
    )
    // Class names come from the page's CSS module maps, so they match the stylesheets the page loaded.
    builder.onLoad({ filter: /\.module\.css$/ }, (args) => ({
      contents: `import { cssModule } from ${JSON.stringify(path.join(src, 'css.ts'))}\nexport default cssModule(${JSON.stringify(path.relative(viewsSrc, args.path).split(path.sep).join('/'))})`,
      loader: 'ts',
      resolveDir: src,
    }))
    builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }))
    // Same SVGR setup as next.config.mjs, so imported SVGs are React components.
    builder.onLoad({ filter: /\.svg$/ }, async (args) => ({
      contents: await svgr(
        await readFile(args.path, 'utf8'),
        { svgo: false, titleProp: true, jsxRuntime: 'automatic', plugins: ['@svgr/plugin-jsx'] },
        { filePath: args.path },
      ),
      loader: 'jsx',
    }))
  },
})

export const buildFrame = async ({ out, viewsEntry, define = {}, production = true }) => {
  if (!viewsEntry) await generate()
  const views = viewsEntry ?? path.join(src, '../generated/registry.ts')
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
    loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.webp': 'dataurl' },
    plugins: [workerPlugin(views)],
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

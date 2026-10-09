import { createRequire } from 'node:module'
import * as esbuild from 'esbuild'

const require = createRequire(import.meta.url)

const buildOptions = (file) => ({
  entryPoints: [file.filePath],
  outfile: file.outputPath,
  bundle: true,
  platform: 'browser',
  sourcemap: 'inline',
  logLevel: 'silent',
  // Like the webpack bundler Cypress uses by default: no Node environment and a browser `path`.
  define: { 'process.env': '{}', global: 'globalThis' },
  alias: { path: require.resolve('path-browserify') },
})

const watchers = new Map()

async function watch(file) {
  let firstBuild = true
  const rerunOnChange = {
    name: 'rerun-on-change',
    setup(build) {
      build.onEnd(() => {
        if (!firstBuild) file.emit('rerun')
        firstBuild = false
      })
    },
  }
  const context = await esbuild.context({ ...buildOptions(file), plugins: [rerunOnChange] })
  await context.rebuild()
  await context.watch()
  watchers.set(file.filePath, context)
  file.on('close', () => {
    watchers.delete(file.filePath)
    context.dispose()
  })
}

/**
 * Bundles specs and support files with esbuild, which takes a fraction of the time the default webpack
 * preprocessor needs for each spec. In `cypress open` it rebuilds and reruns a spec when its files change.
 */
export async function esbuildPreprocessor(file) {
  if (!file.shouldWatch) {
    await esbuild.build(buildOptions(file))
  } else if (!watchers.has(file.filePath)) {
    await watch(file)
  }
  return file.outputPath
}

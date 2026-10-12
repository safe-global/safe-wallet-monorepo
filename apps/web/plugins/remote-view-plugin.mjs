import { existsSync, readFileSync } from 'fs'
import path from 'path'

const VIEW_FILE = /packages[\\/]views[\\/]src[\\/](components|features)[\\/].*\.tsx$/

// Swaps every sandboxed view module for its generated wrapper, whatever path it was imported by,
// so the page never runs view code. The mapping comes from scripts/remote-view-generate.mjs.
export const remoteViewReplacement = (webpack, webRoot) => {
  const file = path.join(webRoot, 'src/remote-view/generated/modules.json')
  if (!existsSync(file)) {
    console.warn(
      'remote-view: generated/modules.json is missing, views are not sandboxed. Run scripts/build-remote-view.mjs.',
    )
    return null
  }
  const modules = new Map(
    Object.entries(JSON.parse(readFileSync(file, 'utf8'))).map(([from, to]) => [path.resolve(from), to]),
  )
  return new webpack.NormalModuleReplacementPlugin(VIEW_FILE, (resolveData) => {
    const resource = resolveData.createData?.resource
    if (!resource) return
    const [file, query = ''] = resource.split('?')
    const wrapper = modules.get(path.resolve(file))
    if (wrapper) resolveData.createData.resource = query ? `${wrapper}?${query}` : wrapper
  })
}

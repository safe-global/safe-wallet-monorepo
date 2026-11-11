import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

export const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const uiDir = path.dirname(require.resolve('@safe-global/ui/package.json'))
export const generatedDir = path.join(appDir, 'src/generated')
export const contentDir = path.join(appDir, 'content/docs')

export interface UiPackageJson {
  exports: Record<string, string>
  dependencies: Record<string, string>
  peerDependencies: Record<string, string>
}

export const readUiPackage = (root: string = uiDir): UiPackageJson =>
  JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))

export const readUiExports = (root: string = uiDir): Record<string, string> => readUiPackage(root).exports

/** Component export keys (`button`, `overlay`, …): every `./<name>` that points into `src/components/` */
export const componentNames = (root: string = uiDir): string[] =>
  Object.entries(readUiExports(root))
    .filter(([key, target]) => !key.includes('*') && target.startsWith('./src/components/'))
    .map(([key]) => key.slice(2))
    .sort()

export const componentFile = (name: string, root: string = uiDir): string =>
  path.join(root, readUiExports(root)[`./${name}`])

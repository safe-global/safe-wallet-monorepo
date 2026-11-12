import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Layer } from '../lib/types.ts'

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

export type { Layer }

export interface ComponentEntry {
  name: string
  layer: Layer
}

const LAYER_PREFIX: Record<Layer, string> = { primitive: './primitives/', component: './components/' }

/** Canonical component keys (`./primitives/button`, `./components/data-table`); the deprecated flat aliases are ignored */
export const componentEntries = (root: string = uiDir): ComponentEntry[] =>
  Object.keys(readUiExports(root))
    .flatMap((key): ComponentEntry[] =>
      (Object.entries(LAYER_PREFIX) as Array<[Layer, string]>)
        .filter(([, prefix]) => key.startsWith(prefix) && !key.includes('*'))
        .map(([layer, prefix]) => ({ name: key.slice(prefix.length), layer })),
    )
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))

export const componentNames = (root: string = uiDir): string[] => componentEntries(root).map((entry) => entry.name)

export const exportKey = ({ name, layer }: ComponentEntry): string => `${LAYER_PREFIX[layer]}${name}`

export const componentFile = (name: string, root: string = uiDir): string => {
  const entry = componentEntries(root).find((item) => item.name === name)
  if (!entry) throw new Error(`${name} is not a component export of @safe-global/ui`)
  return path.join(root, readUiExports(root)[exportKey(entry)])
}

/** Repo-internal references that must not reach docs readers or registry consumers */
export const INTERNAL_REFERENCE =
  /\.claude\/|AGENTS\.md|apps\/web|@safe-global\/views|packages\/(ui|theme|views)\/|\.storybook\//

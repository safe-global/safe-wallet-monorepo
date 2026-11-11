import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import ts from 'typescript'
import { appDir, componentFile, componentNames, readUiPackage, uiDir } from './paths.ts'
import { readDeclarations, readThemeInline, stylesDir } from './tokens.ts'

export const REGISTRY_NAME = 'safe'
export const NAMESPACE = '@safe'
export const HOMEPAGE = 'https://github.com/safe-global/safe-wallet-monorepo/tree/dev/apps/design-system'
const STYLE_DIR = `registry/${REGISTRY_NAME}`

type FileType = 'registry:ui' | 'registry:lib' | 'registry:hook' | 'registry:file'
type ItemType = FileType | 'registry:theme'

export interface RegistryFile {
  path: string
  type: FileType
  target?: string
}

type CssTree = { [key: string]: CssTree | string }

export interface RegistryItem {
  name: string
  type: ItemType
  title: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  cssVars?: { theme: Record<string, string>; light: Record<string, string>; dark: Record<string, string> }
  css?: CssTree
}

export interface Registry {
  $schema: string
  name: string
  homepage: string
  items: RegistryItem[]
}

interface Source {
  name: string
  type: FileType
  /** Absolute path of the source file in packages/ui */
  file: string
  /** Folder under registry/safe */
  folder: 'ui' | 'lib' | 'hooks'
}

const titleOf = (name: string): string =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const packageName = (specifier: string): string => {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

const sources = (root: string): Source[] => [
  ...componentNames(root).map((name) => ({
    name,
    type: 'registry:ui' as const,
    file: componentFile(name, root),
    folder: 'ui' as const,
  })),
  { name: 'provider', type: 'registry:ui', file: path.join(root, 'src/provider.tsx'), folder: 'ui' },
  { name: 'utils', type: 'registry:lib', file: path.join(root, 'src/lib/utils.ts'), folder: 'lib' },
  { name: 'use-mobile', type: 'registry:hook', file: path.join(root, 'src/hooks/use-mobile.ts'), folder: 'hooks' },
  { name: 'use-tablet', type: 'registry:hook', file: path.join(root, 'src/hooks/use-tablet.ts'), folder: 'hooks' },
]

interface ResolvedImport {
  specifier: string
  start: number
  end: number
  /** Registry item the import points at, for a local module */
  item?: string
  /** Local asset copied into the same item, e.g. `table.module.css` */
  asset?: string
  /** Rewritten specifier for the registry copy */
  rewrite?: string
}

const localItem = (absolute: string, byFile: Map<string, Source>): Source | undefined =>
  byFile.get(absolute.replace(/\.(tsx?)$/, ''))

const resolveImports = (source: Source, byFile: Map<string, Source>): ResolvedImport[] => {
  const text = readFileSync(source.file, 'utf8')
  const sourceFile = ts.createSourceFile(source.file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const result: ResolvedImport[] = []
  for (const statement of sourceFile.statements) {
    const moduleSpecifier =
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier
    if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue
    const specifier = moduleSpecifier.text
    const entry: ResolvedImport = {
      specifier,
      start: moduleSpecifier.getStart(sourceFile) + 1,
      end: moduleSpecifier.end - 1,
    }
    if (specifier.startsWith('.')) {
      const absolute = path.resolve(path.dirname(source.file), specifier)
      if (/\.(css|svg|png|json)$/.test(specifier)) {
        if (path.dirname(absolute) !== path.dirname(source.file))
          throw new Error(`${source.file}: asset ${specifier} outside its folder`)
        entry.asset = path.basename(absolute)
      } else {
        const target = localItem(absolute, byFile)
        if (!target) throw new Error(`${source.file}: ${specifier} is not a registry item`)
        entry.item = target.name
        entry.rewrite = `@/${STYLE_DIR}/${target.folder}/${path.basename(target.file).replace(/\.(tsx?)$/, '')}`
      }
    }
    result.push(entry)
  }
  return result
}

export interface BuiltItem {
  item: RegistryItem
  /** Transformed file contents keyed by path relative to the app */
  outputs: Record<string, string>
}

const transform = (source: Source, imports: ResolvedImport[]): string => {
  let text = readFileSync(source.file, 'utf8')
  for (const entry of [...imports].sort((a, b) => b.start - a.start)) {
    if (entry.rewrite) text = text.slice(0, entry.start) + entry.rewrite + text.slice(entry.end)
  }
  const needsClient = source.type === 'registry:ui' || source.type === 'registry:hook'
  if (needsClient && !/^\s*['"]use client['"]/.test(text)) text = `'use client'\n\n${text}`
  return text
}

const buildItem = (source: Source, byFile: Map<string, Source>, ranges: Record<string, string>): BuiltItem => {
  const imports = resolveImports(source, byFile)
  const dependencies = new Set<string>()
  const registryDependencies = new Set<string>()
  for (const entry of imports) {
    if (entry.item && entry.item !== source.name) registryDependencies.add(`${NAMESPACE}/${entry.item}`)
    if (entry.specifier.startsWith('.')) continue
    const name = packageName(entry.specifier)
    if (name === 'react' || name === 'react-dom') continue
    const range = ranges[name]
    if (!range) throw new Error(`${source.file}: ${name} is not a dependency of @safe-global/ui`)
    dependencies.add(`${name}@${range}`)
  }
  const fileName = path.basename(source.file)
  const mainPath = `${STYLE_DIR}/${source.folder}/${fileName}`
  const files: RegistryFile[] = [{ path: mainPath, type: source.type }]
  const outputs: Record<string, string> = { [mainPath]: transform(source, imports) }
  for (const entry of imports) {
    if (!entry.asset) continue
    const assetPath = `${STYLE_DIR}/${source.folder}/${entry.asset}`
    files.push({ path: assetPath, type: 'registry:file', target: `components/ui/${entry.asset}` })
    outputs[assetPath] = readFileSync(path.join(path.dirname(source.file), entry.asset), 'utf8')
  }
  const item: RegistryItem = {
    name: source.name,
    type: source.type,
    title: titleOf(source.name),
    ...(dependencies.size ? { dependencies: [...dependencies].sort() } : {}),
    ...(registryDependencies.size ? { registryDependencies: [...registryDependencies].sort() } : {}),
    files,
  }
  return { item, outputs }
}

const stripDashes = (entries: Array<[string, string]>): Record<string, string> =>
  Object.fromEntries(entries.map(([name, value]) => [name.replace(/^--/, ''), value]))

const cssTree = (nodes: postcss.ChildNode[] | undefined): CssTree => {
  const tree: CssTree = {}
  for (const node of nodes ?? []) {
    if (node.type === 'rule') tree[node.selector] = cssTree(node.nodes)
    if (node.type === 'atrule') tree[`@${node.name} ${node.params}`.trim()] = node.nodes ? cssTree(node.nodes) : {}
    if (node.type === 'decl') tree[node.prop] = node.value
  }
  return tree
}

export const buildThemeItem = (root: string, ranges: Record<string, string>): RegistryItem => {
  const tokensCss = readFileSync(path.join(stylesDir(root), 'tokens.css'), 'utf8')
  const themeCss = readFileSync(path.join(stylesDir(root), 'tailwind-theme.css'), 'utf8')
  const stylesCss = readFileSync(path.join(stylesDir(root), 'styles.css'), 'utf8')
  const { ':root': light, '.dark': dark } = readDeclarations(tokensCss, [':root', '.dark'])
  const theme = readThemeInline(themeCss).map(({ name, value }) => [name, value] as [string, string])
  const css: CssTree = {}
  postcss.parse(themeCss).walkAtRules((rule) => {
    if (rule.name === 'import') css[`@import ${rule.params}`] = {}
    if (rule.name === 'custom-variant') css[`@custom-variant ${rule.params}`] = {}
  })
  postcss.parse(stylesCss).walkAtRules('layer', (rule) => {
    css[`@layer ${rule.params}`] = cssTree(rule.nodes)
  })
  const imported = Object.keys(css)
    .filter((key) => key.startsWith('@import'))
    .map((key) => key.replace(/^@import\s+['"]([^'"]+)['"].*$/, '$1'))
  return {
    name: 'theme',
    type: 'registry:theme',
    title: 'Theme',
    description: 'Safe UI design tokens: light and dark variables, the Tailwind theme mapping and base styles.',
    dependencies: imported.map((specifier) => `${packageName(specifier)}@${ranges[packageName(specifier)]}`).sort(),
    cssVars: { theme: stripDashes(theme), light: stripDashes(light), dark: stripDashes(dark) },
    css,
  }
}

export const buildRegistry = (root: string = uiDir): { registry: Registry; outputs: Record<string, string> } => {
  const pkg = readUiPackage(root)
  const ranges = { ...pkg.peerDependencies, ...pkg.dependencies }
  const all = sources(root)
  const byFile = new Map(all.map((source) => [source.file.replace(/\.(tsx?)$/, ''), source]))
  const outputs: Record<string, string> = {}
  const items: RegistryItem[] = []
  for (const source of all) {
    const built = buildItem(source, byFile, ranges)
    items.push(built.item)
    Object.assign(outputs, built.outputs)
  }
  items.push(buildThemeItem(root, ranges))
  items.sort((a, b) => a.name.localeCompare(b.name))
  return {
    registry: { $schema: 'https://ui.shadcn.com/schema/registry.json', name: REGISTRY_NAME, homepage: HOMEPAGE, items },
    outputs,
  }
}

export const generateRegistry = (root: string = uiDir): Registry => buildRegistry(root).registry

export const serialiseRegistry = (registry: Registry): string => `${JSON.stringify(registry, null, 2)}\n`

export const registryJsonPath = path.join(appDir, 'registry.json')

export const main = (): void => {
  const { registry, outputs } = buildRegistry()
  rmSync(path.join(appDir, STYLE_DIR), { recursive: true, force: true })
  for (const [file, content] of Object.entries(outputs)) {
    mkdirSync(path.dirname(path.join(appDir, file)), { recursive: true })
    writeFileSync(path.join(appDir, file), content)
  }
  writeFileSync(registryJsonPath, serialiseRegistry(registry))
  console.log(`registry: ${registry.items.length} items`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import type { StoryEntry, StoryIndex, StorySource } from '../lib/types.ts'
import { appDir, generatedDir, readUiExports, uiDir } from './paths.ts'

export const HIDDEN_TAG = 'docs-hidden'

const storiesDir = (root: string) => path.join(root, 'src/components/stories')

export const toSlug = (exportName: string): string =>
  exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()

/** Storybook's `storyNameFromExport` */
export const toTitle = (exportName: string): string =>
  exportName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())

const dedent = (text: string): string => {
  const lines = text.split('\n')
  const indents = lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => line.match(/^ */)![0].length)
  const min = indents.length ? Math.min(...indents) : 0
  return [lines[0], ...lines.slice(1).map((line) => line.slice(min))].join('\n').trim()
}

const unwrapExpression = (node: ts.Expression): ts.Expression => {
  let current = node
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression
  }
  return current
}

const getProperty = (object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined => {
  for (const prop of object.properties) {
    if (ts.isPropertyAssignment(prop) && prop.name.getText() === name) return unwrapExpression(prop.initializer)
    if (ts.isMethodDeclaration(prop) && prop.name.getText() === name) return undefined
  }
  return undefined
}

const getMethod = (object: ts.ObjectLiteralExpression, name: string): ts.MethodDeclaration | undefined =>
  object.properties.find(
    (prop): prop is ts.MethodDeclaration => ts.isMethodDeclaration(prop) && prop.name.getText() === name,
  )

const stringArray = (node: ts.Expression | undefined): string[] =>
  node && ts.isArrayLiteralExpression(node)
    ? node.elements.filter(ts.isStringLiteralLike).map((element) => element.text)
    : []

const jsDocOf = (node: ts.Node): string | undefined => {
  const docs = (node as ts.Node & { jsDoc?: ts.JSDoc[] }).jsDoc
  if (!docs?.length) return undefined
  const comment = docs[docs.length - 1].comment
  const text = typeof comment === 'string' ? comment : comment?.map((part) => part.getText()).join('')
  return text?.trim() || undefined
}

type ArgValue = { text: string; isString: boolean }

const readArgs = (node: ts.Expression | undefined, sourceFile: ts.SourceFile): Map<string, ArgValue> => {
  const args = new Map<string, ArgValue>()
  if (!node || !ts.isObjectLiteralExpression(node)) return args
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) continue
    const value = unwrapExpression(prop.initializer)
    args.set(prop.name.getText(sourceFile).replace(/^['"]|['"]$/g, ''), {
      text: ts.isStringLiteralLike(value) ? value.text : value.getText(sourceFile),
      isString: ts.isStringLiteralLike(value),
    })
  }
  return args
}

const argsToAttributes = (args: Map<string, ArgValue>): { attributes: string; children?: string } => {
  const parts: string[] = []
  let children: string | undefined
  for (const [name, value] of args) {
    if (name === 'children') {
      children = value.isString ? value.text : `{${value.text}}`
      continue
    }
    if (value.isString) parts.push(`${name}="${value.text.replace(/"/g, '&quot;')}"`)
    else if (value.text === 'true') parts.push(name)
    else parts.push(`${name}={${value.text}}`)
  }
  return { attributes: parts.join(' '), children }
}

interface ImportBinding {
  local: string
  imported: string
  isDefault: boolean
  isNamespace: boolean
  isType: boolean
  specifier: string
}

const exportKeyByFile = (root: string): Map<string, string> => {
  const map = new Map<string, string>()
  for (const [key, target] of Object.entries(readUiExports(root))) {
    if (key.includes('*')) continue
    map.set(path.join(root, target).replace(/\.(tsx?|mjs)$/, ''), `@safe-global/ui/${key.slice(2)}`)
  }
  return map
}

const rewriteSpecifier = (specifier: string, fromDir: string, root: string, keys: Map<string, string>): string => {
  if (!specifier.startsWith('.')) return specifier
  const absolute = path.resolve(fromDir, specifier).replace(/\.(tsx?|mjs)$/, '')
  const key = keys.get(absolute)
  if (key) return key
  const hooks = path.join(root, 'src/hooks')
  if (absolute.startsWith(`${hooks}/`)) return `@safe-global/ui/hooks/${path.basename(absolute)}`
  throw new Error(`Story import ${specifier} in ${fromDir} does not map to a package export`)
}

const identifiersIn = (text: string): Set<string> => new Set(text.match(/[A-Za-z_$][\w$]*/g) ?? [])

const buildImportHeader = (bindings: ImportBinding[], code: string): string => {
  const used = identifiersIn(code)
  const bySpecifier = new Map<string, { named: string[]; defaultName?: string; namespace?: string }>()
  for (const binding of bindings) {
    if (binding.isType || !used.has(binding.local)) continue
    const entry = bySpecifier.get(binding.specifier) ?? { named: [] }
    if (binding.isDefault) entry.defaultName = binding.local
    else if (binding.isNamespace) entry.namespace = binding.local
    else
      entry.named.push(binding.imported === binding.local ? binding.local : `${binding.imported} as ${binding.local}`)
    bySpecifier.set(binding.specifier, entry)
  }
  const lines: string[] = []
  for (const [specifier, entry] of bySpecifier) {
    if (entry.namespace) lines.push(`import * as ${entry.namespace} from '${specifier}'`)
    const parts = [entry.defaultName, entry.named.length ? `{ ${entry.named.join(', ')} }` : undefined].filter(Boolean)
    if (parts.length) lines.push(`import ${parts.join(', ')} from '${specifier}'`)
  }
  const isExternal = (line: string) => !line.includes("'@safe-global/ui/")
  return [...lines.filter(isExternal), ...lines.filter((line) => !isExternal(line))].join('\n')
}

export interface ParsedStoryFile {
  component: string
  title: string
  /** The meta declares decorators, which own the canvas padding */
  decorated: boolean
  stories: Array<StoryEntry & { tags: string[]; code: string }>
}

export const parseStoryFile = (file: string, root: string = uiDir, keys = exportKeyByFile(root)): ParsedStoryFile => {
  const text = readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const component = path.basename(file).replace(/\.stories\.tsx$/, '')
  const fromDir = path.dirname(file)

  const bindings: ImportBinding[] = []
  const locals = new Map<string, ts.Statement>()
  let meta: ts.ObjectLiteralExpression | undefined
  const storyNodes: Array<{ name: string; node: ts.VariableStatement; init?: ts.ObjectLiteralExpression }> = []

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const clause = statement.importClause
      if (!clause) continue
      const specifier = rewriteSpecifier(statement.moduleSpecifier.text, fromDir, root, keys)
      const typeOnly = clause.isTypeOnly
      if (clause.name) {
        bindings.push({
          local: clause.name.text,
          imported: 'default',
          isDefault: true,
          isNamespace: false,
          isType: typeOnly,
          specifier,
        })
      }
      const named = clause.namedBindings
      if (named && ts.isNamespaceImport(named)) {
        bindings.push({
          local: named.name.text,
          imported: '*',
          isDefault: false,
          isNamespace: true,
          isType: typeOnly,
          specifier,
        })
      } else if (named) {
        for (const element of named.elements) {
          bindings.push({
            local: element.name.text,
            imported: element.propertyName?.text ?? element.name.text,
            isDefault: false,
            isNamespace: false,
            isType: typeOnly || element.isTypeOnly,
            specifier,
          })
        }
      }
      continue
    }
    const isExported =
      ts.canHaveModifiers(statement) && ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue
        const name = declaration.name.text
        const init = declaration.initializer ? unwrapExpression(declaration.initializer) : undefined
        if (name === 'meta' && init && ts.isObjectLiteralExpression(init)) meta = init
        if (isExported)
          storyNodes.push({
            name,
            node: statement,
            init: init && ts.isObjectLiteralExpression(init) ? init : undefined,
          })
        else locals.set(name, statement)
      }
    } else if (ts.isFunctionDeclaration(statement) && statement.name && !isExported) {
      locals.set(statement.name.text, statement)
    } else if (ts.isExportAssignment(statement) && !meta) {
      const expression = unwrapExpression(statement.expression)
      if (ts.isObjectLiteralExpression(expression)) meta = expression
    }
  }
  locals.delete('meta')
  if (!meta) throw new Error(`${file}: no meta object`)

  const titleNode = getProperty(meta, 'title')
  if (!titleNode || !ts.isStringLiteralLike(titleNode)) throw new Error(`${file}: meta has no literal title`)
  const metaComponent = getProperty(meta, 'component')?.getText(sourceFile)
  const metaArgs = readArgs(getProperty(meta, 'args'), sourceFile)

  const withLocals = (code: string): string => {
    const included = new Set<string>()
    const queue = [...identifiersIn(code)]
    while (queue.length) {
      const name = queue.shift()!
      const statement = locals.get(name)
      if (!statement || included.has(name)) continue
      included.add(name)
      queue.push(...identifiersIn(statement.getText(sourceFile)))
    }
    const declarations = [...locals.entries()]
      .filter(([name]) => included.has(name))
      .map(([, statement]) => statement)
      .filter((statement, index, all) => all.indexOf(statement) === index)
      .sort((a, b) => a.pos - b.pos)
      .map((statement) => statement.getText(sourceFile))
    return [...declarations, code].join('\n\n')
  }

  const stories = storyNodes.map(({ name, node, init }) => {
    const tags = init ? stringArray(getProperty(init, 'tags')) : []
    const storyArgs = new Map([...metaArgs, ...(init ? readArgs(getProperty(init, 'args'), sourceFile) : [])])
    const renderProp = init ? getProperty(init, 'render') : undefined
    const renderMethod = init ? getMethod(init, 'render') : undefined
    let code: string

    const render =
      renderProp && (ts.isArrowFunction(renderProp) || ts.isFunctionExpression(renderProp)) ? renderProp : renderMethod
    if (render?.body) {
      const param = render.parameters[0]?.name
      const paramName = param && ts.isIdentifier(param) ? param.text : undefined
      if (ts.isBlock(render.body)) {
        const block = dedent(render.body.getText(sourceFile))
        const argsLine = paramName
          ? `\n  const ${paramName} = { ${[...storyArgs].map(([key, value]) => `${key}: ${value.isString ? JSON.stringify(value.text) : value.text}`).join(', ')} }`
          : ''
        code = `function ${name}() {${argsLine}${block.slice(1)}`
      } else {
        code = dedent(unwrapExpression(render.body as ts.Expression).getText(sourceFile))
        if (paramName) {
          const { attributes } = argsToAttributes(storyArgs)
          code = code.replace(new RegExp(`\\s*\\{\\.\\.\\.${paramName}\\}`, 'g'), attributes ? ` ${attributes}` : '')
        }
      }
    } else if (metaComponent) {
      const { attributes, children } = argsToAttributes(storyArgs)
      const open = `${metaComponent}${attributes ? ` ${attributes}` : ''}`
      code = children ? `<${open}>${children}</${metaComponent}>` : `<${open} />`
    } else {
      throw new Error(`${file}: story ${name} has neither render nor meta.component`)
    }

    const body = withLocals(code)
    const header = buildImportHeader(bindings, body)
    return {
      exportName: name,
      slug: toSlug(name),
      title: toTitle(name),
      description: jsDocOf(node),
      tags,
      code: header ? `${header}\n\n${body}` : body,
    }
  })

  return { component, title: titleNode.text, decorated: Boolean(getProperty(meta, 'decorators')), stories }
}

export const storyFiles = (root: string = uiDir): string[] =>
  readdirSync(storiesDir(root))
    .filter((file) => file.endsWith('.stories.tsx'))
    .sort()
    .map((file) => path.join(storiesDir(root), file))

export const generateStories = (
  root: string = uiDir,
): { index: StoryIndex; sources: StorySource; decorated: Set<string> } => {
  const keys = exportKeyByFile(root)
  const decorated = new Set<string>()
  const index: StoryIndex = []
  const sources: StorySource = {}
  for (const file of storyFiles(root)) {
    const parsed = parseStoryFile(file, root, keys)
    if (parsed.decorated) decorated.add(parsed.component)
    const visible = parsed.stories.filter((story) => !story.tags.includes(HIDDEN_TAG))
    index.push({
      component: parsed.component,
      title: parsed.title,
      stories: visible.map(({ exportName, slug, title, description }) => ({
        exportName,
        slug,
        title,
        ...(description ? { description } : {}),
      })),
    })
    sources[parsed.component] = Object.fromEntries(visible.map((story) => [story.slug, story.code]))
  }
  return { index, sources, decorated }
}

const previewModule = (component: string, decorated: boolean): string => `'use client'

import type { ComponentType } from 'react'
import { composeStories } from '@storybook/react'
import * as stories from '@ui-stories/${component}.stories'

type Composed = ComponentType & { parameters?: { layout?: string } }

const composed = composeStories(stories) as unknown as Record<string, Composed>

const PADDING: Record<string, string> = ${decorated ? "{ fullscreen: '0', centered: '0', padded: '0' }" : "{ fullscreen: '0', centered: '1rem', padded: '1rem' }"}

export default function Preview({ name }: { name: string }) {
  const Story = composed[name]
  if (!Story) return null
  const layout = Story.parameters?.layout ?? 'padded'
  const centered = layout === 'centered'
  return (
    <div
      data-layout={layout}
      style={{
        padding: PADDING[layout] ?? '1rem',
        ...(centered ? { display: 'flex', justifyContent: 'center', alignItems: 'center' } : {}),
      }}
    >
      <Story />
    </div>
  )
}
`

const previewIndex = (index: StoryIndex): string => `'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

type Preview = ComponentType<{ name: string }>

export const previews: Record<string, Preview> = {
${index.map(({ component }) => `  '${component}': dynamic(() => import('./${component}'), { ssr: false }),`).join('\n')}
}
`

const MOCK_ASSET = /["'](mock-assets\/[^"']+)["']/g

/** Stories load `mock-assets/…` relative to their document, so each preview page gets its own copy */
export const mockAssetsByPreview = (sources: StorySource): Array<{ dir: string; asset: string }> =>
  Object.entries(sources).flatMap(([component, stories]) =>
    Object.entries(stories).flatMap(([slug, code]) =>
      [...new Set([...code.matchAll(MOCK_ASSET)].map((match) => match[1]))].map((asset) => ({
        dir: `preview/${component}/${slug}`,
        asset,
      })),
    ),
  )

const copyMockAssets = (sources: StorySource): void => {
  const publicPreview = path.join(appDir, 'public/preview')
  rmSync(publicPreview, { recursive: true, force: true })
  for (const { dir, asset } of mockAssetsByPreview(sources)) {
    const from = path.join(appDir, asset)
    if (!existsSync(from))
      throw new Error(`A story uses ${asset}, which is missing from apps/design-system/mock-assets`)
    const to = path.join(appDir, 'public', dir, asset)
    mkdirSync(path.dirname(to), { recursive: true })
    copyFileSync(from, to)
  }
}

export const main = (): void => {
  const { index, sources, decorated } = generateStories()
  const previewsDir = path.join(generatedDir, 'previews')
  rmSync(previewsDir, { recursive: true, force: true })
  mkdirSync(previewsDir, { recursive: true })
  writeFileSync(path.join(generatedDir, 'story-index.json'), `${JSON.stringify(index, null, 2)}\n`)
  writeFileSync(path.join(generatedDir, 'stories.json'), `${JSON.stringify(sources, null, 2)}\n`)
  for (const { component } of index)
    writeFileSync(path.join(previewsDir, `${component}.tsx`), previewModule(component, decorated.has(component)))
  writeFileSync(path.join(previewsDir, 'index.ts'), previewIndex(index))
  copyMockAssets(sources)
  const count = index.reduce((total, entry) => total + entry.stories.length, 0)
  console.log(`stories: ${index.length} files, ${count} stories`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()

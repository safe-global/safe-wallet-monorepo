/**
 * Webpack/Rspack loader for modules of @safe-global/views (packages/views/src).
 *
 * Every import of a view module must be another view module, an asset, or an entry in
 * policy.json. The module is compiled to CommonJS and replaced by a wrapper that imports the
 * allowed dependencies and evaluates the compiled code with `runView` from src/sandbox/runtime.ts.
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import policy from './policy.json' with { type: 'json' }

const VIEW_SRC = path.resolve(import.meta.dirname, '../../../packages/views/src')
const VIEW_PREFIX = '@safe-global/views/'
const ASSET = /\.(css|svg|png|jpe?g|gif|webp)$/
const RUNTIME_PROVIDED = new Set(['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'])
const SUFFIXES = ['', '.tsx', '.ts', '.js', '/index.tsx', '/index.ts', '/index.js']
const TRUSTED = new Set(policy.trusted.map((file) => path.join(VIEW_SRC, file)))

type Usage = { def: boolean; ns: boolean; named: Set<string> }

const findFile = (base: string) =>
  SUFFIXES.map((s) => base + s).find((f) => fs.existsSync(f) && fs.statSync(f).isFile())

const isTrusted = (file: string) => TRUSTED.has(file.replace(/\.(tsx?|js)$/, ''))

function resolveLocal(from: string, specifier: string) {
  if (specifier.startsWith('.')) return findFile(path.resolve(path.dirname(from), specifier))
  if (specifier.startsWith(VIEW_PREFIX)) return findFile(path.join(VIEW_SRC, specifier.slice(VIEW_PREFIX.length)))
  return undefined
}

function checkPolicy(from: string, specifier: string) {
  if (RUNTIME_PROVIDED.has(specifier)) return
  if (policy.packages.some((p) => specifier === p || specifier.startsWith(p + '/'))) return
  if (policy.modules.includes(specifier)) return
  const file = resolveLocal(from, specifier)
  if (file && file.startsWith(VIEW_SRC + path.sep) && (ASSET.test(file) || !isTrusted(file))) return
  throw new Error(
    `${path.relative(VIEW_SRC, from)} imports "${specifier}", which apps/web/sandbox/policy.json does not allow for view code`,
  )
}

function collect(source: string, file: string) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const usage = new Map<string, Usage>()
  const exportsNames = new Set<string>()
  const starExports: string[] = []
  const usageOf = (spec: string): Usage => {
    if (!usage.has(spec)) usage.set(spec, { def: false, ns: false, named: new Set() })
    return usage.get(spec) as Usage
  }
  const hasModifier = (node: ts.Node, kind: ts.SyntaxKind) =>
    ((ts.canHaveModifiers(node) && ts.getModifiers(node)) || []).some((m) => m.kind === kind)

  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) {
      const u = usageOf((st.moduleSpecifier as ts.StringLiteral).text)
      const clause = st.importClause
      if (!clause || clause.isTypeOnly) continue
      if (clause.name) u.def = true
      const b = clause.namedBindings
      if (b && ts.isNamespaceImport(b)) u.ns = true
      if (b && ts.isNamedImports(b))
        for (const el of b.elements) {
          if (el.isTypeOnly) continue
          const name = (el.propertyName || el.name).text
          if (name === 'default') u.def = true
          else u.named.add(name)
        }
    } else if (ts.isExportDeclaration(st)) {
      if (st.isTypeOnly) continue
      const spec = st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier) ? st.moduleSpecifier.text : undefined
      if (!st.exportClause) {
        if (spec) {
          usageOf(spec).ns = true
          starExports.push(spec)
        }
        continue
      }
      if (ts.isNamespaceExport(st.exportClause)) {
        if (spec) usageOf(spec).ns = true
        exportsNames.add(st.exportClause.name.text)
        continue
      }
      for (const el of st.exportClause.elements) {
        if (el.isTypeOnly) continue
        exportsNames.add(el.name.text)
        if (spec) usageOf(spec).named.add((el.propertyName || el.name).text)
      }
    } else if (ts.isExportAssignment(st)) {
      exportsNames.add('default')
    } else if (hasModifier(st, ts.SyntaxKind.ExportKeyword) && !hasModifier(st, ts.SyntaxKind.DeclareKeyword)) {
      if (ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) continue
      if (hasModifier(st, ts.SyntaxKind.DefaultKeyword)) exportsNames.add('default')
      else if (ts.isVariableStatement(st))
        for (const d of st.declarationList.declarations) {
          if (ts.isIdentifier(d.name)) exportsNames.add(d.name.text)
        }
      else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isEnumDeclaration(st)) && st.name)
        exportsNames.add(st.name.text)
    }
  }
  return { usage, exportsNames, starExports }
}

export default function viewLoader(this: { resourcePath: string }, source: string): string {
  const file = this.resourcePath
  const { outputText } = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      isolatedModules: true,
    },
  })
  const required = [...new Set([...outputText.matchAll(/require\("([^"]+)"\)/g)].map((m) => m[1]))]
  for (const spec of required) checkPolicy(file, spec)

  const { usage, exportsNames, starExports } = collect(source, file)
  const lines = [`import { runView as __runView } from '@/sandbox/runtime'`]
  const deps: string[] = []
  required.forEach((spec, i) => {
    if (RUNTIME_PROVIDED.has(spec)) return
    const u = usage.get(spec) || { def: false, ns: false, named: new Set<string>() }
    const s = JSON.stringify(spec)
    if (u.ns) {
      lines.push(`import * as __m${i} from ${s}`)
      deps.push(`${s}: __m${i}`)
      return
    }
    if (!u.def && u.named.size === 0) {
      lines.push(`import ${s}`)
      deps.push(`${s}: { __esModule: true }`)
      return
    }
    const named = [...u.named]
    const parts: string[] = []
    if (u.def) parts.push(`__m${i}_default`)
    if (named.length) parts.push(`{ ${named.map((n) => `${n} as __m${i}_${n}`).join(', ')} }`)
    lines.push(`import ${parts.join(', ')} from ${s}`)
    const fields = ['__esModule: true']
    if (u.def) fields.push(`default: __m${i}_default`)
    for (const n of named) fields.push(`${n}: __m${i}_${n}`)
    deps.push(`${s}: { ${fields.join(', ')} }`)
  })
  const relative = path.relative(VIEW_SRC, file)
  lines.push(
    `const __view = __runView(${JSON.stringify(outputText)}, { ${deps.join(', ')} }, ${JSON.stringify(relative)})`,
  )
  for (const name of exportsNames) {
    lines.push(
      name === 'default' ? `export default __view.default` : `export const ${name} = __view[${JSON.stringify(name)}]`,
    )
  }
  for (const spec of starExports) lines.push(`export * from ${JSON.stringify(spec)}`)
  return lines.join('\n') + '\n'
}

/**
 * Webpack/Rspack loader for modules under storybook/src.
 *
 * Every import of a view module must be another view module, an asset, or an entry in
 * policy.json. The module is compiled to CommonJS and replaced by a wrapper that imports the
 * allowed dependencies and evaluates the compiled code with `runView` from src/sandbox/runtime.ts.
 */
const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const POLICY_DIR = path.join(__dirname, 'policy.d')

/** policy.json plus every fragment in policy.d/, read on each call so new fragments apply without a restart. */
function readPolicy() {
  const parts = [path.join(__dirname, 'policy.json')]
  if (fs.existsSync(POLICY_DIR))
    for (const f of fs.readdirSync(POLICY_DIR).sort()) if (f.endsWith('.json')) parts.push(path.join(POLICY_DIR, f))
  const merged = { packages: [], modules: [], widgets: [] }
  for (const f of parts) {
    const p = JSON.parse(fs.readFileSync(f, 'utf8'))
    for (const key of Object.keys(merged)) merged[key].push(...(p[key] || []))
  }
  return merged
}

const WEB_SRC = path.resolve(__dirname, '../src')
const VIEW_SRC = path.resolve(__dirname, '../../../storybook/src')
const ASSET = /\.(css|svg|png|jpe?g|gif|webp)$/
const RUNTIME_PROVIDED = new Set(['react', 'react/jsx-runtime', 'react/jsx-dev-runtime'])
const SUFFIXES = ['', '.tsx', '.ts', '.js', '/index.tsx', '/index.ts', '/index.js']

const findFile = (base) => SUFFIXES.map((s) => base + s).find((f) => fs.existsSync(f) && fs.statSync(f).isFile())

function resolveLocal(from, specifier) {
  if (specifier.startsWith('.')) return findFile(path.resolve(path.dirname(from), specifier))
  if (specifier.startsWith('@views/')) return findFile(path.join(VIEW_SRC, specifier.slice('@views/'.length)))
  if (specifier.startsWith('@/')) {
    const sub = specifier.slice(2)
    return findFile(path.join(WEB_SRC, sub)) || findFile(path.join(VIEW_SRC, sub))
  }
  return undefined
}

const asAlias = (file) => '@/' + path.relative(WEB_SRC, file).replace(/(\/index)?\.(tsx?|js)$/, '')

function checkPolicy(from, specifier, policy = readPolicy()) {
  if (RUNTIME_PROVIDED.has(specifier)) return
  if (policy.packages.some((p) => specifier === p || specifier.startsWith(p + '/'))) return
  const trusted = [...policy.modules, ...policy.widgets]
  const allows = (spec) => trusted.some((t) => (t.endsWith('/') ? spec.startsWith(t) : spec === t))
  if (allows(specifier)) return
  if (specifier.startsWith('@/public/') && ASSET.test(specifier)) return
  const file = resolveLocal(from, specifier)
  if (file && (file.startsWith(VIEW_SRC + path.sep) || ASSET.test(file))) return
  if (file && file.startsWith(WEB_SRC + path.sep) && allows(asAlias(file))) return
  throw new Error(
    `${path.relative(VIEW_SRC, from)} imports "${specifier}", which apps/web/sandbox/policy.json does not allow for view code`,
  )
}

function collect(source, file) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const usage = new Map()
  const exportsNames = new Set()
  const starExports = []
  const use = (spec) => {
    if (!usage.has(spec)) usage.set(spec, { def: false, ns: false, named: new Set() })
    return usage.get(spec)
  }
  const hasModifier = (node, kind) => (ts.getModifiers(node) || []).some((m) => m.kind === kind)

  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) {
      const u = use(st.moduleSpecifier.text)
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
      const spec = st.moduleSpecifier && st.moduleSpecifier.text
      if (!st.exportClause) {
        use(spec).ns = true
        starExports.push(spec)
        continue
      }
      if (ts.isNamespaceExport(st.exportClause)) {
        use(spec).ns = true
        exportsNames.add(st.exportClause.name.text)
        continue
      }
      for (const el of st.exportClause.elements) {
        if (el.isTypeOnly) continue
        exportsNames.add(el.name.text)
        if (spec) use(spec).named.add((el.propertyName || el.name).text)
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
      else if (st.name) exportsNames.add(st.name.text)
    }
  }
  return { usage, exportsNames, starExports }
}

function compile(source, file) {
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
  return { outputText, required }
}

// Browser and host globals that do not exist inside a view compartment (see src/sandbox/runtime.ts).
const HOST_GLOBALS = new Set([
  'window',
  'document',
  'globalThis',
  'self',
  'fetch',
  'localStorage',
  'sessionStorage',
  'navigator',
  'location',
  'history',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'queueMicrotask',
  'XMLHttpRequest',
  'WebSocket',
  'process',
  'ResizeObserver',
  'IntersectionObserver',
  'MutationObserver',
  'matchMedia',
  'getComputedStyle',
  'HTMLElement',
  'HTMLInputElement',
  'Element',
  'Node',
  'Event',
  'CustomEvent',
  'crypto',
  'atob',
  'btoa',
  'URL',
  'URLSearchParams',
  'Blob',
  'FileReader',
  'alert',
  'confirm',
  'open',
  'performance',
  'structuredClone',
])

function hostGlobalUses(source, file) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const declared = new Set()
  const found = []
  const collect = (node) => {
    if (
      (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isBindingElement(node)) &&
      ts.isIdentifier(node.name)
    )
      declared.add(node.name.text)
    if ((ts.isFunctionDeclaration(node) || ts.isImportSpecifier(node) || ts.isImportClause(node)) && node.name)
      declared.add(node.name.text)
    if (ts.isNamespaceImport(node)) declared.add(node.name.text)
    ts.forEachChild(node, collect)
  }
  collect(sf)
  const visit = (node) => {
    if (ts.isIdentifier(node) && HOST_GLOBALS.has(node.text) && !declared.has(node.text)) {
      const p = node.parent
      const isName =
        (ts.isPropertyAccessExpression(p) && p.name === node) ||
        (ts.isPropertyAssignment(p) && p.name === node) ||
        ts.isPropertySignature(p) ||
        ts.isJsxAttribute(p) ||
        ts.isTypeReferenceNode(p) ||
        ts.isQualifiedName(p) ||
        (ts.isMethodDeclaration(p) && p.name === node)
      const inType = (() => {
        for (let q = p; q; q = q.parent) if (ts.isTypeNode(q)) return true
        return false
      })()
      if (!isName && !inType) {
        const { line } = sf.getLineAndCharacterOfPosition(node.getStart())
        found.push(
          `${path.relative(VIEW_SRC, file)}:${line + 1} uses "${node.text}", which views do not have; pass what you need in as a prop`,
        )
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

/** Returns the policy violations of one view module, without throwing. */
function checkViewFile(file) {
  const source = fs.readFileSync(file, 'utf8')
  const { required } = compile(source, file)
  const policy = readPolicy()
  const errors = hostGlobalUses(source, file)
  for (const spec of required) {
    try {
      checkPolicy(file, spec, policy)
    } catch (e) {
      errors.push(e.message)
    }
  }
  return errors
}

module.exports = function viewLoader(source) {
  const file = this.resourcePath
  const { outputText, required } = compile(source, file)
  const policy = readPolicy()
  for (const spec of required) checkPolicy(file, spec, policy)

  const { usage, exportsNames, starExports } = collect(source, file)
  const lines = [`import { runView as __runView } from '@/sandbox/runtime'`]
  const deps = []
  required.forEach((spec, i) => {
    if (RUNTIME_PROVIDED.has(spec)) return
    const u = usage.get(spec) || { def: false, ns: false, named: new Set() }
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
    const parts = []
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

module.exports.checkViewFile = checkViewFile
module.exports.VIEW_SRC = VIEW_SRC
module.exports.WEB_SRC = WEB_SRC

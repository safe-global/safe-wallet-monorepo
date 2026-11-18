// One-off migration: point every import of a re-exported name in apps/web and apps/web-tanstack at the
// file that declares it, split jest.mock/spyOn calls the same way, then delete re-exports nothing uses.
// Usage (repo root): node --max-old-space-size=8192 scripts/codemods/unbarrel.cjs [--dry] [--features-only] [--only <file>]
const path = require('node:path')
const fs = require('node:fs')

const ROOT = path.resolve(__dirname, '../..')
const WEB = path.join(ROOT, 'apps/web')
const SRC = path.join(WEB, 'src') + path.sep
const TANSTACK_SRC = path.join(ROOT, 'apps/web-tanstack/src') + path.sep
const DRY = process.argv.includes('--dry')
// Only barrels under src/features: other re-exporting files such as store/slices.ts are deliberate entry points.
const FEATURES_ONLY = process.argv.includes('--features-only')
// One barrel only, as a path relative to the repo root.
const ONLY = process.argv.includes('--only')
  ? path.join(ROOT, process.argv[process.argv.indexOf('--only') + 1])
  : undefined
// Mocked files whose real module cannot load while a mock factory runs: an import cycle reads their exports
// before they are initialized, or a test's other mocks break their imports. Their real exports are read lazily.
const LAZY_MOCK_FILES = new Set([
  '@/features/multichain/utils/utils',
  '@/features/spaces/hooks/useSpaceMembers',
  '@/features/spaces/components/Sidebar/variants/SpaceSelectorDropdown/SpaceSelectorDropdown',
])
const ts = require(path.join(ROOT, 'node_modules/typescript'))

const parsed = ts.getParsedCommandLineOfConfigFile(
  path.join(WEB, 'tsconfig.json'),
  {},
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'))
    },
  },
)
const tanstackFiles = ts.sys.readDirectory(TANSTACK_SRC, ['.ts', '.tsx'], ['**/node_modules/**'])
const program = ts.createProgram({
  rootNames: [...parsed.fileNames, ...tanstackFiles],
  options: { ...parsed.options, incremental: false, noEmit: true },
})
const checker = program.getTypeChecker()

const notDeps = (f) => !f.includes(`${path.sep}node_modules${path.sep}`)
// web-tanstack maps `@/` to apps/web/src, so its files are rewritten like web's.
const isOwn = (f) => (f.startsWith(WEB + path.sep) || f.startsWith(TANSTACK_SRC)) && notDeps(f)
// packages/views and config/test resolve `@/` differently in their own builds: keep what they use, never rewrite.
const isKeepOnly = (f) => !isOwn(f) && notDeps(f)
const isTestFile = (f) => /\.test\.tsx?$/.test(f)
const textOf = (sf, node) => node.getText(sf).replace(/\s+/g, '')

const hasValueReexport = (sf) =>
  sf.statements.some((s) => ts.isExportDeclaration(s) && s.moduleSpecifier && !s.isTypeOnly)

const targets = new Set(
  program
    .getSourceFiles()
    .filter((sf) => sf.fileName.startsWith(FEATURES_ONLY ? path.join(SRC, 'features') + path.sep : SRC))
    .filter((sf) => !ONLY || sf.fileName === ONLY)
    .filter((sf) => !sf.isDeclarationFile && hasValueReexport(sf))
    .map((sf) => sf.fileName),
)
const keptNames = new Map([...targets].map((t) => [t, new Set()]))
const fullyUsed = new Set()
const manual = []
const stats = { importsRewritten: 0, namespacesSplit: 0, mocksSplit: 0, reexportsDeleted: 0, barrelsDeleted: 0 }

const edits = new Map()
const addEdit = (file, start, end, text) => {
  if (!edits.has(file)) edits.set(file, [])
  edits.get(file).push({ start, end, text })
}

const moduleFileOf = (spec) => checker.getSymbolAtLocation(spec)?.declarations?.find(ts.isSourceFile)?.fileName
const resolveSpec = (spec, fromFile) =>
  ts.resolveModuleName(spec, fromFile, program.getCompilerOptions(), ts.sys).resolvedModule?.resolvedFileName
const resolveFinal = (sym) => (sym && sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym)
function exportsOf(file) {
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(file))
  return new Map(moduleSymbol ? checker.getExportsOfModule(moduleSymbol).map((e) => [e.escapedName, e]) : [])
}

function specifierFor(file) {
  const noExt = file.replace(/\.(d\.)?tsx?$/, '').replace(/\/index$/, '')
  if (file.startsWith(SRC)) return '@/' + noExt.slice(SRC.length)
  const pkg = noExt.match(/\/packages\/(utils|store|theme|views)\/src\/(.+)$/)
  if (pkg) return `@safe-global/${pkg[1]}/${pkg[2]}`
  const cfg = noExt.match(/\/config\/test\/(.+)$/)
  return cfg ? `@safe-global/test/${cfg[1]}` : null
}

// Name under which `file` exports `target`, preferring `wanted`, then 'default'.
function exportNameIn(file, target, wanted) {
  const names = [...exportsOf(file).values()]
    .filter((e) => e === target || resolveFinal(e) === target)
    .map((e) => e.escapedName)
  if (names.includes(wanted)) return wanted
  if (names.includes('default')) return 'default'
  return names[0] ?? null
}

// Where a name exported by `barrel` is declared, as { spec, name, file }, or null when it must stay on the barrel.
function declaringModule(symbol, wanted, barrel) {
  const target = resolveFinal(symbol)
  const file = target?.declarations?.[0]?.getSourceFile().fileName
  if (!file || file === barrel) return null
  const spec = specifierFor(file)
  const name = spec && exportNameIn(file, target, wanted)
  return name ? { spec, name, file } : null
}

const valueExportNames = (file) =>
  [...exportsOf(file)].filter(([, e]) => (resolveFinal(e)?.flags ?? 0) & ts.SymbolFlags.Value).map(([n]) => n)

// Names this file imports from `barrel` as values: what an automock of the barrel had to cover.
function valueNamesImportedFrom(sf, barrel) {
  const names = []
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause || stmt.importClause.isTypeOnly) continue
    if (moduleFileOf(stmt.moduleSpecifier) !== barrel) continue
    if (stmt.importClause.name) names.push('default')
    for (const el of stmt.importClause.namedBindings?.elements ?? []) {
      if (!el.isTypeOnly) names.push((el.propertyName ?? el.name).text)
    }
  }
  return names
}

// `jest.mock(<barrel>)` without a factory becomes an automock of each file that declares a name the test imports.
function splitAutomock(sf, call, barrel) {
  const spec = call.arguments[0].text
  const names = valueNamesImportedFrom(sf, barrel)
  if (!names.length) return false
  const barrelExports = exportsOf(barrel)
  const specs = new Set()
  for (const name of names) {
    const moved = declaringModule(barrelExports.get(name), name, barrel)
    if (!moved) keptNames.get(barrel).add(name)
    specs.add(moved?.spec ?? spec)
  }
  const node = ts.isExpressionStatement(call.parent) ? call.parent : call
  addEdit(sf.fileName, node.getStart(sf), node.getEnd(), [...specs].map((s) => `jest.mock('${s}')`).join('\n'))
  stats.mocksSplit++
  return true
}

const renderNamed = (items) => items.map((i) => (i.name === i.local ? i.name : `${i.name} as ${i.local}`))

function renderImport({ spec, typeOnly, items }) {
  const def = items.find((i) => i.name === 'default')
  const named = renderNamed(items.filter((i) => i !== def))
  const parts = [def?.local, named.length ? `{ ${named.join(', ')} }` : null].filter(Boolean)
  return `import ${typeOnly ? 'type ' : ''}${parts.join(', ')} from '${spec}'`
}

const renderExport = ({ spec, typeOnly, items }) =>
  `export ${typeOnly ? 'type ' : ''}{ ${renderNamed(items).join(', ')} } from '${spec}'`

function rewriteDeclaration(stmt, barrel, kind) {
  const groups = new Map()
  const place = (nameNode, wanted, local, typeOnly) => {
    const moved = declaringModule(checker.getSymbolAtLocation(nameNode), wanted, barrel)
    if (!moved) keptNames.get(barrel).add(wanted)
    const spec = moved?.spec ?? stmt.moduleSpecifier.text
    const key = `${typeOnly ? 'type ' : ''}${spec}`
    if (!groups.has(key)) groups.set(key, { spec, typeOnly, items: [] })
    groups.get(key).items.push({ name: moved?.name ?? wanted, local })
  }
  if (kind === 'import') {
    const clause = stmt.importClause
    if (clause.name) place(clause.name, 'default', clause.name.text, clause.isTypeOnly)
    for (const el of clause.namedBindings?.elements ?? []) {
      place(el.name, (el.propertyName ?? el.name).text, el.name.text, clause.isTypeOnly || el.isTypeOnly)
    }
    return [...groups.values()].map(renderImport).join('\n')
  }
  for (const el of stmt.exportClause.elements) {
    place(el.name, (el.propertyName ?? el.name).text, el.name.text, stmt.isTypeOnly || el.isTypeOnly)
  }
  return [...groups.values()].map(renderExport).join('\n')
}

// `import * as ns from <barrel>` used only as `ns.x`, `ns.X` in a type, or `jest.spyOn(ns, 'x')`
// becomes one namespace import per declaring module. Returns false when ns is used any other way.
function splitNamespaceImport(sf, stmt, barrel) {
  const nsNode = stmt.importClause.namedBindings.name
  const nsSym = checker.getSymbolAtLocation(nsNode)
  const uses = []
  let unsupported = false
  let typeQuery = false
  ts.forEachChild(sf, function walk(node) {
    if (
      ts.isIdentifier(node) &&
      node !== nsNode &&
      node.text === nsNode.text &&
      checker.getSymbolAtLocation(node) === nsSym
    ) {
      const parent = node.parent
      const args = ts.isCallExpression(parent) ? parent.arguments : []
      if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
        uses.push({ node, prop: parent.name.text, nameNode: parent.name })
      } else if (ts.isQualifiedName(parent) && parent.left === node) {
        uses.push({ node, prop: parent.right.text, nameNode: parent.right })
      } else if (
        args[0] === node &&
        args[1] &&
        ts.isStringLiteral(args[1]) &&
        /^jest\.(spyOn|replaceProperty)$/.test(textOf(sf, parent.expression))
      ) {
        uses.push({ node, prop: args[1].text, nameNode: args[1], literal: true })
      } else if (ts.isTypeQueryNode(parent)) {
        typeQuery = true
      } else {
        unsupported = true
      }
    }
    ts.forEachChild(node, walk)
  })
  if (unsupported || uses.length === 0) return false

  const barrelExports = exportsOf(barrel)
  const originalSpec = stmt.moduleSpecifier.text
  for (const u of uses) {
    const moved = declaringModule(barrelExports.get(u.prop), u.prop, barrel)
    if (!moved) keptNames.get(barrel).add(u.prop)
    u.spec = moved?.spec ?? originalSpec
    u.name = moved?.name ?? u.prop
  }
  const specs = [...new Set(uses.map((u) => u.spec))]
  if (!typeQuery && specs.length === 1 && specs[0] === originalSpec && uses.every((u) => u.name === u.prop)) return true

  // The original name stays on one module; others are named after their file, like `import * as useChains`.
  const taken = new Set(sf.text.match(/[A-Za-z_$][\w$]*/g))
  const aliasBySpec = new Map()
  const nameFor = (spec) => {
    const keepsOriginal = !typeQuery && (specs.length === 1 || spec === originalSpec)
    if (keepsOriginal) return nsNode.text
    const base = spec
      .split('/')
      .pop()
      .replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    const candidates = [base, `${nsNode.text}${base[0].toUpperCase()}${base.slice(1)}`]
    const used = new Set(aliasBySpec.values())
    const free = candidates.find((c) => /^[A-Za-z_$]/.test(c) && !taken.has(c) && !used.has(c))
    if (free) return free
    let i = 2
    while (taken.has(`${candidates[1]}${i}`) || used.has(`${candidates[1]}${i}`)) i++
    return `${candidates[1]}${i}`
  }
  for (const spec of specs) aliasBySpec.set(spec, nameFor(spec))
  const lines = typeQuery ? [stmt.getText(sf)] : []
  for (const spec of specs) lines.push(`import * as ${aliasBySpec.get(spec)} from '${spec}'`)
  for (const u of uses) u.alias = aliasBySpec.get(u.spec)
  addEdit(sf.fileName, stmt.getStart(sf), stmt.getEnd(), lines.join('\n'))
  for (const u of uses) {
    if (u.alias !== nsNode.text) addEdit(sf.fileName, u.node.getStart(sf), u.node.getEnd(), u.alias)
    if (u.name !== u.prop) {
      addEdit(sf.fileName, u.nameNode.getStart(sf), u.nameNode.getEnd(), u.literal ? `'${u.name}'` : u.name)
    }
  }
  stats.namespacesSplit++
  return true
}

function visitImports(sf) {
  for (const stmt of sf.statements) {
    const isImport = ts.isImportDeclaration(stmt) && stmt.importClause
    const isExportFrom = ts.isExportDeclaration(stmt) && stmt.moduleSpecifier
    if (!isImport && !isExportFrom) continue
    const barrel = moduleFileOf(stmt.moduleSpecifier)
    if (!barrel || !targets.has(barrel)) continue

    const namedBindings = isImport ? stmt.importClause.namedBindings : null
    const isNamespaceImport = namedBindings && ts.isNamespaceImport(namedBindings)
    const isStarExport = isExportFrom && (!stmt.exportClause || ts.isNamespaceExport(stmt.exportClause))
    // `export * from <barrel>`: this file's own consumers already resolve through it to the declaring file.
    if (isStarExport && !stmt.exportClause) continue
    if (isNamespaceImport || isStarExport) {
      if (isNamespaceImport && splitNamespaceImport(sf, stmt, barrel)) continue
      if (isTestFile(sf.fileName)) {
        manual.push(`${path.relative(ROOT, sf.fileName)}: import * as … from '${stmt.moduleSpecifier.text}'`)
        continue
      }
      fullyUsed.add(barrel)
      continue
    }
    addEdit(
      sf.fileName,
      stmt.getStart(sf),
      stmt.getEnd(),
      rewriteDeclaration(stmt, barrel, isImport ? 'import' : 'export'),
    )
    stats.importsRewritten++
  }
  ts.forEachChild(sf, function walk(node) {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0]
      const barrel = arg && ts.isStringLiteral(arg) && moduleFileOf(arg)
      if (barrel && targets.has(barrel)) fullyUsed.add(barrel)
    }
    ts.forEachChild(node, walk)
  })
}

function visitKeepOnly(sf) {
  for (const stmt of sf.statements) {
    const spec = (ts.isImportDeclaration(stmt) || ts.isExportDeclaration(stmt)) && stmt.moduleSpecifier
    const barrel = spec && moduleFileOf(spec)
    if (!barrel || !targets.has(barrel)) continue
    const clause = ts.isImportDeclaration(stmt) ? stmt.importClause : null
    const named = clause ? clause.namedBindings : stmt.exportClause
    if (!named || ts.isNamespaceImport(named) || ts.isNamespaceExport(named)) {
      fullyUsed.add(barrel)
      continue
    }
    if (clause?.name) keptNames.get(barrel).add('default')
    for (const el of named.elements ?? []) keptNames.get(barrel).add((el.propertyName ?? el.name).text)
  }
}

const isJestRequireCall = (sf, expr, fns) =>
  ts.isCallExpression(expr) &&
  new RegExp(`^jest\\.(${fns})$`).test(textOf(sf, expr.expression)) &&
  expr.arguments[0] &&
  ts.isStringLiteral(expr.arguments[0])
const isRequireActualCall = (sf, expr) => isJestRequireCall(sf, expr, 'requireActual')
const isRequireActualOrMockCall = (sf, expr) => isJestRequireCall(sf, expr, 'requireActual|requireMock')

// Edits that point `jest.requireActual('<barrel>').X` or `jest.requireMock('<barrel>').X` inside node at X's declaring file.
function requireActualEdits(sf, node) {
  const out = []
  ;(function walk(n) {
    if (ts.isPropertyAccessExpression(n) && isRequireActualOrMockCall(sf, n.expression)) {
      const arg = n.expression.arguments[0]
      const barrel = resolveSpec(arg.text, sf.fileName)
      if (barrel && targets.has(barrel)) {
        const moved = declaringModule(exportsOf(barrel).get(n.name.text), n.name.text, barrel)
        if (moved) {
          out.push({ start: arg.getStart(sf), end: arg.getEnd(), text: `'${moved.spec}'` })
          if (moved.name !== n.name.text)
            out.push({ start: n.name.getStart(sf), end: n.name.getEnd(), text: moved.name })
        } else {
          keptNames.get(barrel).add(n.name.text)
        }
      }
    }
    ts.forEachChild(n, walk)
  })(node)
  return out
}

function textWithEdits(sf, node, nodeEdits) {
  const base = node.getStart(sf)
  let text = node.getText(sf)
  for (const e of [...nodeEdits].sort((a, b) => b.start - a.start)) {
    text = text.slice(0, e.start - base) + e.text + text.slice(e.end - base)
  }
  return text
}

function factoryObject(factory) {
  if (!factory || !(ts.isArrowFunction(factory) || ts.isFunctionExpression(factory))) return null
  let body = factory.body
  if (ts.isBlock(body)) {
    if (body.statements.length !== 1 || !ts.isReturnStatement(body.statements[0])) return null
    body = body.statements[0].expression
  }
  while (body && ts.isParenthesizedExpression(body)) body = body.expression
  return body && ts.isObjectLiteralExpression(body) ? body : null
}

const mockedFilesCache = new Map()
function filesMockedIn(sf) {
  if (mockedFilesCache.has(sf.fileName)) return mockedFilesCache.get(sf.fileName)
  const files = new Set()
  ts.forEachChild(sf, function walk(n) {
    if (
      ts.isCallExpression(n) &&
      /^jest\.(mock|doMock)$/.test(textOf(sf, n.expression)) &&
      n.arguments[0] &&
      ts.isStringLiteral(n.arguments[0])
    ) {
      const file = resolveSpec(n.arguments[0].text, sf.fileName)
      if (file) files.add(file)
    }
    ts.forEachChild(n, walk)
  })
  mockedFilesCache.set(sf.fileName, files)
  return files
}

// A factory with logic before `return { ... }`, whose keys all live in one file: point the mock and its
// `jest.requireActual(<barrel>)` at that file and keep the factory as written.
function retargetFactory(sf, call, barrel) {
  const factory = call.arguments[1]
  if (!(ts.isArrowFunction(factory) || ts.isFunctionExpression(factory)) || !ts.isBlock(factory.body)) return false
  const last = factory.body.statements.at(-1)
  let obj = last && ts.isReturnStatement(last) ? last.expression : null
  while (obj && ts.isParenthesizedExpression(obj)) obj = obj.expression
  if (!obj || !ts.isObjectLiteralExpression(obj)) return false
  const spec = call.arguments[0].text
  const barrelExports = exportsOf(barrel)
  const targetSpecs = new Set()
  for (const p of obj.properties) {
    if (ts.isSpreadAssignment(p)) {
      if (isRequireActualCall(sf, p.expression) && p.expression.arguments[0].text === spec) continue
      return false
    }
    const key = p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null
    if (!key) return false
    if (key === '__esModule') continue
    const moved = declaringModule(barrelExports.get(key), key, barrel)
    if (!moved || moved.name !== key) return false
    targetSpecs.add(moved.spec)
  }
  if (targetSpecs.size !== 1) return false
  const [target] = targetSpecs
  addEdit(sf.fileName, call.arguments[0].getStart(sf), call.arguments[0].getEnd(), `'${target}'`)
  ts.forEachChild(factory, function walk(n) {
    if (isRequireActualCall(sf, n) && n.arguments[0].text === spec) {
      addEdit(sf.fileName, n.arguments[0].getStart(sf), n.arguments[0].getEnd(), `'${target}'`)
    }
    ts.forEachChild(n, walk)
  })
  stats.mocksSplit++
  return true
}

// `jest.mock(<barrel>, () => ({ a, b }))` becomes one `jest.mock(<declaring file>, ...)` per file, same values.
// Returns false when the factory is not a plain object literal.
function splitJestMock(sf, call, barrel) {
  const spec = call.arguments[0].text
  const where = `${path.relative(ROOT, sf.fileName)}: jest.mock('${spec}')`
  if (!call.arguments[1]) {
    if (splitAutomock(sf, call, barrel)) return true
    manual.push(`${where} (automock, test imports nothing from it)`)
    return false
  }
  const obj = factoryObject(call.arguments[1])
  if (!obj) {
    if (retargetFactory(sf, call, barrel)) return true
    manual.push(`${where} (factory is not a plain object)`)
    return false
  }
  const barrelExports = exportsOf(barrel)
  const groups = new Map()
  // Spreads stay in the barrel's mock in their original order; any other spread describes the barrel's own API.
  const barrelSpreads = []
  let spreadActual = false
  for (const p of obj.properties) {
    if (ts.isSpreadAssignment(p)) {
      if (isRequireActualCall(sf, p.expression) && p.expression.arguments[0].text === spec) spreadActual = true
      barrelSpreads.push(p)
      continue
    }
    const key = p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null
    if (!key) {
      manual.push(`${where} (computed key)`)
      return false
    }
    if (key === '__esModule') continue
    const isWholeMember = !ts.isShorthandPropertyAssignment(p) && !ts.isPropertyAssignment(p)
    const valueNode = ts.isPropertyAssignment(p) ? p.initializer : p
    const value = ts.isShorthandPropertyAssignment(p)
      ? key
      : textWithEdits(sf, valueNode, requireActualEdits(sf, valueNode))
    const moved = declaringModule(barrelExports.get(key), key, barrel)
    if (!moved) keptNames.get(barrel).add(key)
    const target = moved?.spec ?? spec
    if (!groups.has(target)) groups.set(target, { file: moved?.file, props: [] })
    groups.get(target).props.push({ key, name: moved?.name ?? key, value, isWholeMember, keyNode: p.name })
  }
  // The test already mocks some declaring files itself; a second factory for the same module would replace it.
  const mockedHere = filesMockedIn(sf)
  for (const [target, group] of groups) if (group.file && mockedHere.has(group.file)) groups.delete(target)
  // A spread of `jest.requireActual(<declaring file>)` belongs to that file's mock.
  const otherSpreads = barrelSpreads.filter((p) => {
    if (!isRequireActualCall(sf, p.expression)) return true
    const spreadFile = resolveSpec(p.expression.arguments[0].text, sf.fileName)
    const owner = [...groups.values()].find((g) => g.file && g.file === spreadFile)
    if (owner) owner.spreadsOwnActual = true
    return !owner
  })
  const hasOtherSpreads = otherSpreads.some(
    (p) => !(isRequireActualCall(sf, p.expression) && p.expression.arguments[0].text === spec),
  )
  if (hasOtherSpreads && !groups.has(spec)) groups.set(spec, { props: [] })
  const lines = [...groups].map(([target, { file, props, spreadsOwnActual }]) => {
    const isBarrel = target === spec
    const parts = isBarrel ? otherSpreads.map((p) => p.getText(sf)) : []
    // The barrel mock named only some of this file's exports, and direct importers used the real rest: keep it real.
    const missing = file && !spreadActual ? valueExportNames(file).filter((n) => !props.some((x) => x.name === n)) : []
    const spread = spreadActual || spreadsOwnActual || (missing.length > 0 && !LAZY_MOCK_FILES.has(target))
    if (spread && !isBarrel) parts.push(`...jest.requireActual('${target}')`)
    if (props.some((x) => x.name === 'default') || (!spread && missing.includes('default')))
      parts.push('__esModule: true')
    if (!spread) {
      for (const n of missing) parts.push(`get ${n}() {\n    return jest.requireActual('${target}').${n}\n  }`)
    }
    for (const x of props) {
      if (x.isWholeMember) parts.push(x.name === x.key ? x.value : x.value.replace(x.keyNode.getText(sf), x.name))
      else parts.push(x.name === x.value ? x.name : `${x.name}: ${x.value}`)
    }
    return `jest.mock('${target}', () => ({\n  ${parts.join(',\n  ')},\n}))`
  })
  const node = ts.isExpressionStatement(call.parent) ? call.parent : call
  addEdit(sf.fileName, node.getStart(sf), node.getEnd(), lines.join('\n'))
  stats.mocksSplit++
  return true
}

function visitJestMocks(sf) {
  ts.forEachChild(sf, function walk(node) {
    const isMockCall =
      ts.isCallExpression(node) &&
      /^jest\.(mock|doMock)$/.test(textOf(sf, node.expression)) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    if (isMockCall) {
      const barrel = resolveSpec(node.arguments[0].text, sf.fileName)
      if (barrel && targets.has(barrel) && splitJestMock(sf, node, barrel)) return
    }
    if (ts.isPropertyAccessExpression(node) && isRequireActualOrMockCall(sf, node.expression)) {
      for (const e of requireActualEdits(sf, node.parent)) {
        if (e.start >= node.getStart(sf) && e.end <= node.getEnd()) addEdit(sf.fileName, e.start, e.end, e.text)
      }
      return
    }
    ts.forEachChild(node, walk)
  })
}

// Names a file exports by itself or through named re-exports, i.e. without its `export *` lines.
function nonStarExportNames(sf) {
  const names = new Set()
  const exported = (node) => ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export
  for (const s of sf.statements) {
    if (ts.isExportAssignment(s)) names.add('default')
    else if (ts.isExportDeclaration(s) && s.exportClause && ts.isNamedExports(s.exportClause)) {
      for (const el of s.exportClause.elements) names.add(el.name.text)
    } else if (ts.isExportDeclaration(s) && s.exportClause && ts.isNamespaceExport(s.exportClause)) {
      names.add(s.exportClause.name.text)
    } else if (ts.isVariableStatement(s) && exported(s)) {
      for (const d of s.declarationList.declarations) if (ts.isIdentifier(d.name)) names.add(d.name.text)
    } else if ((ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s) || ts.isEnumDeclaration(s)) && exported(s)) {
      names.add(ts.getCombinedModifierFlags(s) & ts.ModifierFlags.Default ? 'default' : s.name?.text)
    }
  }
  return names
}

// A barrel that keeps its `export *` lines needs everything behind them.
function markStarDependencies() {
  for (let changed = true; changed;) {
    changed = false
    for (const barrel of targets) {
      const sf = program.getSourceFile(barrel)
      const local = nonStarExportNames(sf)
      if (!fullyUsed.has(barrel) && ![...keptNames.get(barrel)].some((n) => !local.has(n))) continue
      for (const s of sf.statements) {
        if (!ts.isExportDeclaration(s) || !s.moduleSpecifier || s.exportClause || s.isTypeOnly) continue
        const inner = moduleFileOf(s.moduleSpecifier)
        if (inner && targets.has(inner) && !fullyUsed.has(inner)) {
          fullyUsed.add(inner)
          changed = true
        }
      }
    }
  }
}

function pruneReexports() {
  for (const barrel of targets) {
    if (fullyUsed.has(barrel)) continue
    const sf = program.getSourceFile(barrel)
    const kept = keptNames.get(barrel)
    const pending = edits.get(barrel) ?? []
    for (const stmt of sf.statements) {
      if (!ts.isExportDeclaration(stmt) || !stmt.moduleSpecifier || stmt.isTypeOnly) continue
      if (pending.some((e) => e.start === stmt.getStart(sf))) continue
      if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
        const keep = stmt.exportClause.elements.filter((el) => el.isTypeOnly || kept.has(el.name.text))
        if (keep.length === stmt.exportClause.elements.length) continue
        const text = keep.length
          ? `export { ${keep.map((el) => el.getText(sf)).join(', ')} } from ${stmt.moduleSpecifier.getText(sf)}`
          : ''
        addEdit(barrel, stmt.getStart(sf), stmt.getEnd(), text)
      } else {
        const local = nonStarExportNames(sf)
        if ([...kept].some((n) => !local.has(n))) continue
        addEdit(barrel, stmt.getStart(sf), stmt.getEnd(), '')
      }
      stats.reexportsDeleted++
    }
  }
}

// A barrel with no statements left (only comments) is deleted.
function writeEdits() {
  for (const [file, list] of edits) {
    let text = fs.readFileSync(file, 'utf8')
    for (const e of list.sort((a, b) => b.start - a.start)) text = text.slice(0, e.start) + e.text + text.slice(e.end)
    const isEmpty = targets.has(file) && ts.createSourceFile(file, text, ts.ScriptTarget.Latest).statements.length === 0
    if (isEmpty) {
      fs.unlinkSync(file)
      stats.barrelsDeleted++
    } else {
      fs.writeFileSync(file, text)
    }
  }
}

for (const sf of program.getSourceFiles()) {
  if (sf.isDeclarationFile) continue
  if (isOwn(sf.fileName)) {
    visitImports(sf)
    visitJestMocks(sf)
  } else if (isKeepOnly(sf.fileName)) {
    visitKeepOnly(sf)
  }
}
markStarDependencies()
pruneReexports()
if (!DRY) writeEdits()

console.log(
  JSON.stringify({ barrels: targets.size, keptWhole: fullyUsed.size, filesChanged: edits.size, ...stats }, null, 2),
)
if (manual.length) console.log(`\nFix by hand (${manual.length}):\n${manual.join('\n')}`)

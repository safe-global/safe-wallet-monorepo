/**
 * Decides whether a change is design-only: it may change styling, copy and presentational markup,
 * but not behaviour. Used by index.cjs (CLI) and the "Design scope" workflow.
 */
const path = require('path')
const ts = require('typescript')
const defaultConfig = require('./config.json')

const globToRegExp = (glob) =>
  new RegExp(
    '^' +
      glob
        .replace(/[.+^${}()|\\]/g, '\\$&')
        .replace(/\*\*\//g, '\u0000')
        .replace(/\*\*/g, '\u0001')
        .replace(/\*/g, '[^/]*')
        .replace(/\u0000/g, '(?:.*/)?')
        .replace(/\u0001/g, '.*') +
      '$',
  )
const matchesAny = (file, globs) => globs.some((g) => globToRegExp(g).test(file))

const parse = (source, file) =>
  ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

const squash = (text) => text.replace(/\s+/g, ' ').trim()
const lineOf = (sf, node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
const isJsx = (node) => ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)

function calleeName(call) {
  const e = call.expression
  if (ts.isIdentifier(e)) return e.text
  if (ts.isPropertyAccessExpression(e)) {
    const full = e.getText()
    return /^(Math|Object|Array|Number|String|Intl)\./.test(full) ? full : e.name.text
  }
  return e.getText()
}

/**
 * A "read" shows data the code already has: names, property access, literals, conditionals and a few
 * allowed calls such as cn() or items.map(item => <jsx/>). Reads may be added, removed or moved freely.
 */
function isRead(expr, config) {
  if (!expr) return true
  if (ts.isParenthesizedExpression(expr) || ts.isAsExpression(expr) || ts.isNonNullExpression(expr))
    return isRead(expr.expression, config)
  if (ts.isIdentifier(expr)) return !config.deniedGlobals.includes(expr.text)
  if (
    ts.isStringLiteral(expr) ||
    ts.isNumericLiteral(expr) ||
    ts.isNoSubstitutionTemplateLiteral(expr) ||
    expr.kind === ts.SyntaxKind.TrueKeyword ||
    expr.kind === ts.SyntaxKind.FalseKeyword ||
    expr.kind === ts.SyntaxKind.NullKeyword ||
    expr.kind === ts.SyntaxKind.UndefinedKeyword
  )
    return true
  if (ts.isPropertyAccessExpression(expr)) return isRead(expr.expression, config)
  if (ts.isElementAccessExpression(expr))
    return isRead(expr.expression, config) && isRead(expr.argumentExpression, config)
  if (ts.isTemplateExpression(expr)) return expr.templateSpans.every((s) => isRead(s.expression, config))
  if (ts.isConditionalExpression(expr))
    return isRead(expr.condition, config) && isRead(expr.whenTrue, config) && isRead(expr.whenFalse, config)
  if (ts.isBinaryExpression(expr)) {
    const op = expr.operatorToken.kind
    if (op >= ts.SyntaxKind.FirstAssignment && op <= ts.SyntaxKind.LastAssignment) return false
    return isRead(expr.left, config) && isRead(expr.right, config)
  }
  if (ts.isPrefixUnaryExpression(expr))
    return expr.operator !== ts.SyntaxKind.PlusPlusToken && expr.operator !== ts.SyntaxKind.MinusMinusToken
      ? isRead(expr.operand, config)
      : false
  if (ts.isArrayLiteralExpression(expr)) return expr.elements.every((e) => isRead(e, config))
  if (ts.isObjectLiteralExpression(expr))
    return expr.properties.every((p) =>
      ts.isPropertyAssignment(p) ? isRead(p.initializer, config) : ts.isShorthandPropertyAssignment(p),
    )
  if (isJsx(expr)) return true
  if (ts.isCallExpression(expr)) {
    if (!config.allowedCalls.includes(calleeName(expr))) return false
    if (ts.isPropertyAccessExpression(expr.expression) && !isRead(expr.expression.expression, config)) return false
    return expr.arguments.every((a) =>
      ts.isArrowFunction(a) ? (ts.isBlock(a.body) ? false : isRead(a.body, config)) : isRead(a, config),
    )
  }
  return false
}

/** Non-JSX code with JSX, copy strings and class strings blanked out. It must not change. */
function skeleton(sf, config) {
  const copyKeys = new Set(config.copyKeys)
  const isCopyString = (node) => {
    let child = node
    let parent = node.parent
    while (parent && (ts.isArrayLiteralExpression(parent) || ts.isParenthesizedExpression(parent))) {
      child = parent
      parent = parent.parent
    }
    return (
      parent &&
      ts.isPropertyAssignment(parent) &&
      parent.initializer === child &&
      copyKeys.has(parent.name.getText(sf).replace(/['"]/g, ''))
    )
  }
  const insideClassCall = (node) => {
    for (let p = node.parent; p; p = p.parent) {
      if (ts.isCallExpression(p) && ['cn', 'clsx', 'cva'].includes(calleeName(p))) return true
      if (ts.isBlock(p) || ts.isSourceFile(p)) return false
    }
    return false
  }
  const transformer = (context) => {
    const visit = (node) => {
      if (isJsx(node)) return ts.factory.createIdentifier('__JSX__')
      if (ts.isCallExpression(node) && calleeName(node) === 'cva')
        return ts.factory.createCallExpression(node.expression, undefined, [
          ts.factory.createIdentifier('__VARIANTS__'),
        ])
      if (
        (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
        (isCopyString(node) || insideClassCall(node))
      )
        return ts.factory.createStringLiteral('__TEXT__')
      return ts.visitEachChild(node, visit, context)
    }
    return (root) => ts.visitNode(root, visit)
  }
  const statements = sf.statements.filter((s) => !ts.isImportDeclaration(s))
  const stripped = ts.factory.updateSourceFile(sf, statements)
  const result = ts.transform(stripped, [transformer])
  const printer = ts.createPrinter({ removeComments: true })
  const text = printer.printFile(result.transformed[0])
  result.dispose()
  return text
}

function valueImports(sf) {
  const out = []
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st)) continue
    const spec = st.moduleSpecifier.text
    const clause = st.importClause
    if (!clause) {
      out.push({ spec, name: '*side-effect*', node: st })
      continue
    }
    if (clause.isTypeOnly) continue
    if (clause.name) out.push({ spec, name: clause.name.text, node: st })
    const b = clause.namedBindings
    if (b && ts.isNamespaceImport(b)) out.push({ spec, name: b.name.text, node: st })
    if (b && ts.isNamedImports(b))
      for (const el of b.elements) if (!el.isTypeOnly) out.push({ spec, name: el.name.text, node: st })
  }
  return out
}

/** Things in JSX that carry behaviour. Their multiset must stay the same. */
function jsxBehaviour(sf, config, isPresentationalTag) {
  const items = new Map()
  const where = new Map()
  const add = (key, node) => {
    key = squash(key)
    items.set(key, (items.get(key) || 0) + 1)
    if (!where.has(key)) where.set(key, lineOf(sf, node))
  }
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf)
      if (/^[a-z]/.test(tag)) {
        if (config.deniedHostElements.includes(tag)) add(`element <${tag}>`, node)
      } else if (!isPresentationalTag(tag)) add(`element <${tag}>`, node)
      for (const attr of node.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attr)) {
          add(`spread {...${attr.expression.getText(sf)}}`, attr)
          continue
        }
        const name = attr.name.getText(sf)
        const init = attr.initializer
        const value = !init
          ? 'true'
          : ts.isStringLiteral(init)
            ? JSON.stringify(init.text)
            : init.expression
              ? init.expression.getText(sf)
              : ''
        const behaviour = config.behaviorProps.includes(name) && (name !== 'name' || /^[a-z]/.test(tag))
        if (/^on[A-Z]/.test(name) || behaviour) add(`${name}={${value}}`, attr)
        else if (init && ts.isJsxExpression(init) && !isRead(init.expression, config)) add(`${name}={${value}}`, attr)
      }
    }
    if (ts.isJsxExpression(node) && node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      if (node.expression && !isRead(node.expression, config)) add(`{${node.expression.getText(sf)}}`, node)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return { items, where }
}

class DesignChecker {
  /**
   * @param {{ readBase: (file: string) => string | undefined, readHead: (file: string) => string | undefined, config?: object }} io
   */
  constructor(io) {
    this.io = io
    this.config = io.config || defaultConfig
    this.presentationalCache = new Map()
  }

  isPresentationalSpec(spec, fromFile) {
    if (
      this.config.presentationalImports.some((p) =>
        p.endsWith('/') ? spec.startsWith(p) : spec === p || spec.startsWith(p + '/'),
      )
    )
      return true
    const target = this.resolve(spec, fromFile)
    return Boolean(target) && this.presentationalErrors(target).length === 0
  }

  resolve(spec, fromFile) {
    let base
    if (spec.startsWith('.')) base = path.posix.join(path.posix.dirname(fromFile), spec)
    else if (spec.startsWith('@/') && !spec.startsWith('@/public/')) base = 'apps/web/src/' + spec.slice(2)
    else return undefined
    for (const s of ['.tsx', '.ts', '/index.tsx', '/index.ts', ''])
      if (/\.tsx?$/.test(base + s) && this.io.readHead(base + s) !== undefined) return base + s
    return undefined
  }

  /** Rules for a file that is new in the change: it must be a pure presentational component. */
  presentationalErrors(file, { story = false } = {}) {
    const cacheKey = `${file}:${story}`
    if (this.presentationalCache.has(cacheKey)) return this.presentationalCache.get(cacheKey)
    this.presentationalCache.set(cacheKey, [])
    const source = this.io.readHead(file)
    const errors = []
    if (source === undefined) return errors
    const sf = parse(source, file)
    const err = (node, msg) => errors.push(`${file}:${lineOf(sf, node)} ${msg}`)
    for (const { spec, node } of valueImports(sf)) {
      if (story && this.config.storyImports.some((p) => spec.startsWith(p))) continue
      if (!this.isPresentationalSpec(spec, file)) err(node, `imports "${spec}", which is not a presentational module`)
    }
    const visit = (node) => {
      if (ts.isIdentifier(node) && this.config.deniedGlobals.includes(node.text)) {
        const p = node.parent
        const isName =
          (ts.isPropertyAccessExpression(p) && p.name === node) || (ts.isPropertyAssignment(p) && p.name === node)
        if (!isName) err(node, `uses "${node.text}"`)
      }
      if (ts.isCallExpression(node)) {
        const name = calleeName(node)
        if (/^use[A-Z]/.test(name) && !this.config.allowedHooks.includes(name)) err(node, `calls the hook ${name}()`)
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) err(node, 'loads code with import()')
      }
      if (ts.isAwaitExpression(node)) err(node, 'uses await')
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        this.config.deniedHostElements.includes(node.tagName.getText(sf))
      )
        err(node, `renders <${node.tagName.getText(sf)}>`)
      if (ts.isJsxAttribute(node) && node.name.getText(sf) === 'dangerouslySetInnerHTML')
        err(node, 'sets dangerouslySetInnerHTML')
      ts.forEachChild(node, visit)
    }
    visit(sf)
    this.presentationalCache.set(cacheKey, errors)
    return errors
  }

  /** A new .ts file may only hold content: constants made of literals, and types. */
  contentErrors(file) {
    const sf = parse(this.io.readHead(file), file)
    const errors = []
    const isLiteralTree = (e) =>
      ts.isAsExpression(e) || ts.isSatisfiesExpression?.(e)
        ? isLiteralTree(e.expression)
        : ts.isStringLiteral(e) ||
          ts.isNumericLiteral(e) ||
          ts.isNoSubstitutionTemplateLiteral(e) ||
          e.kind === ts.SyntaxKind.TrueKeyword ||
          e.kind === ts.SyntaxKind.FalseKeyword ||
          e.kind === ts.SyntaxKind.NullKeyword ||
          (ts.isArrayLiteralExpression(e) && e.elements.every(isLiteralTree)) ||
          (ts.isObjectLiteralExpression(e) &&
            e.properties.every((p) => ts.isPropertyAssignment(p) && isLiteralTree(p.initializer)))
    for (const st of sf.statements) {
      if (ts.isImportDeclaration(st) && st.importClause?.isTypeOnly) continue
      if (ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st)) continue
      if (
        ts.isVariableStatement(st) &&
        st.declarationList.declarations.every((d) => d.initializer && isLiteralTree(d.initializer))
      )
        continue
      errors.push(
        `${file}:${lineOf(sf, st)} is a new code file; a design change may only add content constants (literals) here`,
      )
    }
    return errors
  }

  /** Rules for a changed TypeScript file: only design slots may differ between base and head. */
  modifiedCodeErrors(file) {
    const before = parse(this.io.readBase(file), file)
    const after = parse(this.io.readHead(file), file)
    const errors = []

    if (skeleton(before, this.config) !== skeleton(after, this.config))
      errors.push(`${file} changes code outside JSX, copy and class strings (hooks, handlers, logic or data)`)

    const importsBefore = new Set(valueImports(before).map((i) => `${i.spec}#${i.name}`))
    const importedFrom = new Map()
    for (const i of valueImports(after)) {
      importedFrom.set(i.name, i.spec)
      if (!importsBefore.has(`${i.spec}#${i.name}`) && !this.isPresentationalSpec(i.spec, file))
        errors.push(
          `${file}:${lineOf(after, i.node)} adds an import of ${i.name} from "${i.spec}", which is not presentational`,
        )
    }
    const beforeFrom = new Map(valueImports(before).map((i) => [i.name, i.spec]))
    const presentationalTag = (from) => (tag) => {
      const root = tag.split('.')[0]
      const spec = from.get(root)
      return Boolean(spec) && this.isPresentationalSpec(spec, file)
    }

    const a = jsxBehaviour(before, this.config, presentationalTag(beforeFrom))
    const b = jsxBehaviour(after, this.config, presentationalTag(importedFrom))
    const rewiring = (key) => this.config.allowHandlerRewiring && /^on[A-Z]\w*=\{[\w.]+\}$/.test(key)
    for (const [key, count] of b.items) {
      const was = a.items.get(key) || 0
      if (count > was && !rewiring(key)) errors.push(`${file}:${b.where.get(key)} adds ${key}`)
    }
    for (const [key, count] of a.items) {
      const now = b.items.get(key) || 0
      if (now < count) errors.push(`${file} removes ${key} (was at line ${a.where.get(key)} before)`)
    }
    return errors
  }

  styleErrors(file) {
    const source = this.io.readHead(file) || ''
    const errors = []
    source.split('\n').forEach((line, i) => {
      if (/url\(\s*['"]?\s*(https?:)?\/\//i.test(line) || /@import\s+(url\()?\s*['"]?(https?:)?\/\//i.test(line))
        errors.push(`${file}:${i + 1} loads a resource from another site`)
      if (/expression\s*\(|behavior\s*:|-moz-binding/i.test(line))
        errors.push(`${file}:${i + 1} uses a scripting CSS feature`)
    })
    return errors
  }

  /**
   * @param {{ status: string, file: string, from?: string }[]} changes from `git diff --name-status`
   * @returns {{ designOnly: boolean, errors: string[], files: { file: string, kind: string, errors: string[] }[] }}
   */
  check(changes) {
    const c = this.config
    const files = []
    for (const { status, file, from } of changes) {
      const kind = this.kindOf(file)
      let errors = []
      if (status === 'D') {
        if (!['style', 'asset', 'snapshot'].includes(kind)) errors.push(`${file} is deleted`)
      } else if (status.startsWith('R') && from) {
        if (!['style', 'asset', 'snapshot'].includes(kind)) errors.push(`${from} is renamed to ${file}`)
      } else if (kind === 'style') errors = this.styleErrors(file)
      else if (kind === 'asset' || kind === 'snapshot') errors = []
      else if (kind === 'test')
        errors.push(`${file} is a test; tests change with behaviour, which a design change must not touch`)
      else if (kind === 'story') errors = this.presentationalErrors(file, { story: true })
      else if (kind === 'code' && status === 'A')
        errors = file.endsWith('.tsx') ? this.presentationalErrors(file) : this.contentErrors(file)
      else if (kind === 'code') errors = this.modifiedCodeErrors(file)
      else errors.push(`${file} is outside the design scope (${c.codeRoots.join(', ')}, styles and images)`)
      files.push({ file, kind, errors: [...new Set(errors)] })
    }
    const errors = files.flatMap((f) => f.errors)
    return { designOnly: errors.length === 0, errors, files }
  }

  kindOf(file) {
    const c = this.config
    if (matchesAny(file, c.styleGlobs)) return 'style'
    if (matchesAny(file, c.assetGlobs)) return 'asset'
    if (matchesAny(file, c.snapshotGlobs)) return 'snapshot'
    if (!c.codeRoots.some((r) => file.startsWith(r)) || !/\.tsx?$/.test(file) || file.endsWith('.d.ts')) return 'other'
    if (matchesAny(file, c.excludedGlobs || [])) return 'other'
    if (/\.(test|spec)\.tsx?$/.test(file) || /__tests__|__mocks__/.test(file)) return 'test'
    if (/\.stories\.tsx?$/.test(file)) return 'story'
    return 'code'
  }
}

module.exports = { DesignChecker, isRead, skeleton, globToRegExp }

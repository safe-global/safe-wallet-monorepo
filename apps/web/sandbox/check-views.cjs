#!/usr/bin/env node
/**
 * Checks the split between views and containers.
 *
 * - A view (any module under storybook/src, except tests and stories) may import only what the
 *   sandbox policy allows (see view-loader.cjs).
 * - A container (any .tsx module under apps/web/src) renders no markup of its own: no host
 *   elements, no className or style, no visible text, and no design-system primitives from
 *   @/components/ui. Everything a user sees comes from a view.
 *
 * Usage: node apps/web/sandbox/check-views.cjs [--all | --views | <file>...]
 * Containers are also checked by the ESLint rule views/no-markup-in-containers.
 */
const fs = require('fs')
const path = require('path')
const ts = require('typescript')
const { checkViewFile, VIEW_SRC, WEB_SRC } = require('./view-loader.cjs')

const WIDGETS = JSON.parse(fs.readFileSync(path.join(__dirname, 'policy.json'), 'utf8')).widgets
const HEAD_TAGS = new Set(['title', 'meta', 'link'])
const STYLE_PROPS = new Set(['className', 'style', 'sx'])
const SKIPPED = /\.(test|stories|spec)\.tsx?$|__tests__|__mocks__|\/mocks\/|\/tests\/|\.d\.ts$/
const CONTAINER_EXEMPT = new Set([
  path.join(WEB_SRC, 'pages/_document.tsx'),
  path.join(WEB_SRC, 'components/common/Track/index.tsx'),
])
// String attributes a container may still set: identity and routing, not copy or styling.
const NON_COPY_PROPS = /^(key|id|name|href|type|target|rel|role|autoComplete|inputMode|data-.*|testId)$/

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(e.name)) out.push(p)
  }
  return out
}

function checkContainer(file) {
  const errors = []
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const at = (node, message) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart())
    errors.push(`${path.relative(process.cwd(), file)}:${line + 1} ${message}`)
  }
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) {
      const spec = node.moduleSpecifier.text
      if (spec.startsWith('@/components/ui/') && spec !== '@/components/ui/ShadcnProvider' && !WIDGETS.includes(spec))
        at(node, `imports the design-system primitive "${spec}"; render it from a view instead`)
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf)
      if (/^[a-z][\w-]*$/.test(tag) && !HEAD_TAGS.has(tag))
        at(node, `renders the host element <${tag}>; move it to a view`)
      for (const attr of node.attributes.properties) {
        if (!ts.isJsxAttribute(attr)) continue
        const name = attr.name.getText(sf)
        if (STYLE_PROPS.has(name)) at(attr, `sets ${name} on <${tag}>; styling belongs in a view`)
        else if (attr.initializer && ts.isStringLiteral(attr.initializer) && !NON_COPY_PROPS.test(name))
          at(
            attr,
            `sets ${name}="${attr.initializer.text.slice(0, 30)}" on <${tag}>; copy and variants belong in a view`,
          )
      }
    }
    if (ts.isJsxText(node) && node.text.trim() && !HEAD_TAGS.has(node.parent.openingElement?.tagName.getText(sf)))
      at(node, `renders the text "${node.text.trim().slice(0, 40)}"; copy belongs in a view`)
    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      ts.isStringLiteral(node.expression) &&
      ts.isJsxElement(node.parent)
    )
      at(node, `renders the text "${node.expression.text.slice(0, 40)}"; copy belongs in a view`)
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return errors
}

function check(file) {
  file = path.resolve(file)
  if (SKIPPED.test(file)) return []
  if (file.startsWith(VIEW_SRC + path.sep)) return checkViewFile(file)
  if (file.startsWith(WEB_SRC + path.sep) && file.endsWith('.tsx') && !CONTAINER_EXEMPT.has(file))
    return checkContainer(file)
  return []
}

const args = process.argv.slice(2)
const files =
  args[0] === '--all' ? [...walk(WEB_SRC), ...walk(VIEW_SRC)] : args[0] === '--views' ? walk(VIEW_SRC) : args
const errors = files.filter((f) => fs.existsSync(f)).flatMap(check)
for (const e of errors) console.log(e)
if (args[0] === '--all' || args[0] === '--views') {
  const byFile = new Set(errors.map((e) => e.split(':')[0]))
  console.log(`${errors.length} problems in ${byFile.size} files`)
}
process.exit(errors.length ? 1 : 0)

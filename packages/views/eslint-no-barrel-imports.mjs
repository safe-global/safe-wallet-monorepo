// Flags imports of a name from a module that only re-exports it (a barrel): import it from the declaring file.
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const EXTS = ['.ts', '.tsx', '.js', '.jsx']
const PARSED_EXT = /\.(tsx?|jsx?)$/

const isFile = (p) => {
  try {
    return fs.statSync(p).isFile()
  } catch {
    return false
  }
}

const resolveModule = (base) => {
  if (PARSED_EXT.test(base) && isFile(base)) return base
  for (const ext of EXTS) if (isFile(base + ext)) return base + ext
  for (const ext of EXTS) if (isFile(path.join(base, 'index' + ext))) return path.join(base, 'index' + ext)
  return null
}

const bindingNames = (name, out = []) => {
  if (ts.isIdentifier(name)) out.push(name.text)
  else for (const el of name.elements) if (!ts.isOmittedExpression(el)) bindingNames(el.name, out)
  return out
}

const hasModifier = (node, kind) => ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((m) => m.kind === kind)

// name -> source specifier for re-exported names, `local` for names the file declares itself
function analyze(file) {
  const text = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    false,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const imported = new Map()
  const reexports = new Map()
  const stars = []
  const local = new Set()

  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && st.importClause) {
      const source = st.moduleSpecifier.text
      const { name, namedBindings } = st.importClause
      if (name) imported.set(name.text, source)
      if (namedBindings && ts.isNamespaceImport(namedBindings)) imported.set(namedBindings.name.text, source)
      if (namedBindings && ts.isNamedImports(namedBindings))
        for (const el of namedBindings.elements) imported.set(el.name.text, source)
    } else if (ts.isExportDeclaration(st)) {
      const source = st.moduleSpecifier && st.moduleSpecifier.text
      if (source && !st.exportClause) stars.push(source)
      else if (source && ts.isNamespaceExport(st.exportClause)) reexports.set(st.exportClause.name.text, source)
      else if (st.exportClause && ts.isNamedExports(st.exportClause)) {
        for (const el of st.exportClause.elements) {
          const localName = (el.propertyName ?? el.name).text
          const from = source ?? imported.get(localName)
          if (from) reexports.set(el.name.text, from)
          else local.add(el.name.text)
        }
      }
    } else if (ts.isExportAssignment(st)) {
      const from = ts.isIdentifier(st.expression) ? imported.get(st.expression.text) : undefined
      if (st.isExportEquals) continue
      if (from) reexports.set('default', from)
      else local.add('default')
    } else if (hasModifier(st, ts.SyntaxKind.ExportKeyword)) {
      if (hasModifier(st, ts.SyntaxKind.DefaultKeyword)) local.add('default')
      else if (ts.isVariableStatement(st))
        for (const d of st.declarationList.declarations) bindingNames(d.name).forEach((n) => local.add(n))
      else if (st.name && ts.isIdentifier(st.name)) local.add(st.name.text)
    }
  }
  return { reexports, stars, local }
}

const cache = new Map()
const exportsOf = (file) => {
  const mtime = fs.statSync(file).mtimeMs
  const hit = cache.get(file)
  if (hit && hit.mtime === mtime) return hit.info
  const info = analyze(file)
  cache.set(file, { mtime, info })
  return info
}

// A feature's index may re-export its components: the component rule bans the direct path from outside.
const isFeatureComponentReexport = (target, source) => {
  const m = target.match(/^(.*\/src\/features\/[^/]+)\/index\.tsx?$/)
  const components = m && m[1] + '/components'
  const resolved = path.resolve(path.dirname(target), source)
  return !!m && (resolved === components || resolved.startsWith(components + '/'))
}

const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'Import a name from the file that declares it, not from a module that re-exports it' },
    schema: [
      {
        type: 'object',
        properties: {
          aliases: { type: 'object', additionalProperties: { type: 'string' } },
          ignore: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      barrel: "'{{name}}' is re-exported by '{{module}}'. Import it from the file that declares it.",
    },
  },
  create(context) {
    const aliases = Object.entries(context.options[0]?.aliases ?? {})
    const ignore = context.options[0]?.ignore ?? []
    const filename = context.filename

    // re-exports of a package are not barrels of this repo
    const isLocal = (source) => source.startsWith('.') || aliases.some(([prefix]) => source.startsWith(prefix))

    const resolveSpecifier = (spec) => {
      if (spec.startsWith('.')) return resolveModule(path.resolve(path.dirname(filename), spec))
      const alias = aliases.find(([prefix]) => spec.startsWith(prefix))
      return alias ? resolveModule(path.join(alias[1], spec.slice(alias[0].length))) : null
    }

    return {
      ImportDeclaration(node) {
        const spec = node.source.value
        if (ignore.some((prefix) => spec === prefix || spec.startsWith(prefix + '/'))) return
        const target = resolveSpecifier(spec)
        if (!target) return
        const { reexports, stars: allStars, local } = exportsOf(target)
        const stars = allStars.filter(isLocal)
        if (!reexports.size && !stars.length) return

        for (const s of node.specifiers) {
          if (s.type === 'ImportNamespaceSpecifier') continue
          const name = s.type === 'ImportDefaultSpecifier' ? 'default' : (s.imported.name ?? s.imported.value)
          if (local.has(name)) continue
          const source = reexports.get(name)
          if (source ? !isLocal(source) || isFeatureComponentReexport(target, source) : !stars.length) continue
          context.report({ node: s, messageId: 'barrel', data: { name, module: spec } })
        }
      },
    }
  },
}

export default { rules: { 'no-barrel-imports': rule } }

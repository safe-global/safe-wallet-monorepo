// One-off migration: move files of one feature (usually into its public/ folder) and rewrite every module path
// that points at them: imports, export-from, import(), require and jest.mock-style calls.
// Inside the feature, paths become relative; everywhere else they use the `@/` alias.
// Usage (repo root): node scripts/codemods/move-to-public.cjs <feature> [<old>=<new>...] [--dry]
//   Paths are relative to apps/web/src/features/<feature>; a directory moves with everything in it.
//   Without pairs, it only makes the feature's own `@/` paths relative.
//   Example: node scripts/codemods/move-to-public.cjs recovery hooks/useRecovery.ts=public/useRecovery.ts
const path = require('node:path')
const fs = require('node:fs')

const ROOT = path.resolve(__dirname, '../..')
const SRC = path.join(ROOT, 'apps/web/src')
const SCANNED = [
  'apps/web/src',
  'apps/web/e2e',
  'apps/web/cypress',
  'apps/web-tanstack/src',
  'packages/views/src',
  'config/test',
].map((d) => path.join(ROOT, d))
const EXTENSIONS = ['.ts', '.tsx', '.d.ts', '/index.ts', '/index.tsx']
const MOCK_CALLS = new Set(['mock', 'doMock', 'unmock', 'requireActual', 'requireMock', 'createMockFromModule'])
const ts = require(path.join(ROOT, 'node_modules/typescript'))

const [feature, ...rest] = process.argv.slice(2)
const DRY = rest.includes('--dry')
const pairs = rest.filter((a) => a.includes('='))
if (!feature) {
  console.error('Usage: node scripts/codemods/move-to-public.cjs <feature> [<old>=<new>...] [--dry]')
  process.exit(1)
}
const FEATURE_DIR = path.join(SRC, 'features', feature)
if (!fs.existsSync(FEATURE_DIR)) throw new Error(`No feature folder at ${FEATURE_DIR}`)

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : listFiles(full)
    return [full]
  })
}

// old absolute file path → new absolute file path
const moves = new Map()
for (const pair of pairs) {
  const [from, to] = pair.split('=').map((p) => path.join(FEATURE_DIR, p))
  if (!fs.existsSync(from)) throw new Error(`Nothing to move at ${from}`)
  const files = fs.statSync(from).isDirectory() ? listFiles(from) : [from]
  for (const file of files) moves.set(file, path.join(to, path.relative(from, file)))
}
const newPathOf = (file) => moves.get(file) ?? file

function resolveFile(spec, fromFile) {
  let base
  if (spec.startsWith('@/')) base = path.join(SRC, spec.slice(2))
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec)
  else return undefined
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base
  return EXTENSIONS.map((ext) => base + ext).find((candidate) => fs.existsSync(candidate))
}

const featureOf = (file) => {
  const rel = path.relative(path.join(SRC, 'features'), file)
  return rel.startsWith('..') ? undefined : rel.split(path.sep)[0]
}

function specifierFor(target, importer, originalSpec) {
  const keepExtension = /\.(json|css|scss|svg|png)$/.test(originalSpec)
  const stripped = keepExtension ? target : target.replace(/\.(d\.)?tsx?$/, '').replace(/\/index$/, '')
  const sameFeature = featureOf(target) !== undefined && featureOf(target) === featureOf(importer)
  const inImporterFolder = target.startsWith(path.dirname(importer) + path.sep)
  if (sameFeature || inImporterFolder || !target.startsWith(SRC + path.sep)) {
    const rel = path.relative(path.dirname(importer), stripped)
    return rel.startsWith('.') ? rel : `./${rel}`
  }
  return '@/' + path.relative(SRC, stripped)
}

// Module path literals in a file: import/export declarations, import(), require(), jest.<mock call>(path).
function moduleLiterals(sf) {
  const found = []
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      found.push(node.moduleSpecifier)
    } else if (ts.isCallExpression(node) && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
      const callee = node.expression
      const isImportOrRequire =
        callee.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(callee) && callee.text === 'require')
      const isJestCall =
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === 'jest' &&
        MOCK_CALLS.has(callee.name.text)
      if (isImportOrRequire || isJestCall) found.push(node.arguments[0])
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return found
}

const stats = { filesMoved: moves.size, filesRewritten: 0, pathsRewritten: 0 }
const sourceFiles = SCANNED.filter((d) => fs.existsSync(d))
  .flatMap(listFiles)
  .filter((f) => /\.(tsx?|mjs|cjs|js)$/.test(f))

for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  const newFile = newPathOf(file)
  // packages/views and config/test resolve `@/` to apps/web/src, but their own files are not moved or made relative.
  const isWebFile = file.startsWith(SRC + path.sep) || file.startsWith(path.join(ROOT, 'apps/web-tanstack/src'))
  const edits = []
  for (const literal of moduleLiterals(sf)) {
    const spec = literal.text
    const target = resolveFile(spec, file)
    if (!target) continue
    const inFeature = featureOf(newFile) === feature && featureOf(target) === feature
    const touched =
      moves.has(target) || (moves.has(file) && spec.startsWith('.')) || (inFeature && spec.startsWith('@/'))
    if (!touched) continue
    const next = isWebFile
      ? specifierFor(newPathOf(target), newFile, spec)
      : '@/' + path.relative(SRC, newPathOf(target)).replace(/\.(d\.)?tsx?$/, '')
    if (next !== spec) edits.push({ start: literal.getStart(sf) + 1, end: literal.getEnd() - 1, text: next })
  }
  if (edits.length === 0) continue
  stats.filesRewritten++
  stats.pathsRewritten += edits.length
  const updated = edits
    .sort((a, b) => b.start - a.start)
    .reduce((acc, e) => acc.slice(0, e.start) + e.text + acc.slice(e.end), text)
  if (!DRY) fs.writeFileSync(file, updated)
}

// ESLint suppressions are keyed by file path, so a moved file would lose its entry.
function renameSuppressions() {
  const file = path.join(ROOT, 'apps/web/eslint-suppressions.json')
  const webDir = path.join(ROOT, 'apps/web')
  const suppressions = JSON.parse(fs.readFileSync(file, 'utf8'))
  const renamed = Object.fromEntries(
    Object.entries(suppressions).map(([key, value]) => {
      const moved = moves.get(path.join(webDir, key))
      return [moved ? path.relative(webDir, moved) : key, value]
    }),
  )
  fs.writeFileSync(file, JSON.stringify(renamed, null, 2) + '\n')
}

if (!DRY) {
  for (const [from, to] of moves) {
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.renameSync(from, to)
  }
  renameSuppressions()
}
console.log(JSON.stringify(stats, null, 2))

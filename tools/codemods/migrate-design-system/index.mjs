#!/usr/bin/env node
/**
 * Rewrites app-local design-system imports to the @safe-global/design-system package.
 * See README.md for the mapping table and usage.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const PKG = '@safe-global/design-system'

/** Presets that moved wholesale. DialogActions is excluded — the app keeps a wrapper. */
const PRESETS = ['SubmitButton', 'ActionBar', 'OnboardingFooter', 'IconAction', 'ChoiceButton', 'SplitMenuButton']

/**
 * Ordered most-specific-first. Each entry maps an old specifier (exact, or a prefix with a
 * trailing segment) to its new home.
 */
const RULES = [
  { from: /^@\/components\/ui\/([A-Za-z0-9._-]+)$/, to: (m) => `${PKG}/components/${m[1]}` },
  { from: /^@\/utils\/cn$/, to: () => `${PKG}/utils/cn` },
  { from: /^@\/hooks\/(use-mobile|use-tablet)$/, to: (m) => `${PKG}/hooks/${m[1]}` },
  {
    from: new RegExp(`^@/components/common/(${PRESETS.join('|')})$`),
    to: (m) => `${PKG}/presets/${m[1]}`,
  },
]

const rewriteSpecifier = (specifier) => {
  for (const rule of RULES) {
    const m = rule.from.exec(specifier)
    if (m) return rule.to(m)
  }
  return null
}

// `from '<spec>'`, `import '<spec>'`, `import('<spec>')`, `jest.mock('<spec>')`, `require('<spec>')`
const SPECIFIER_SITE = /(from\s+|import\s*\(\s*|import\s+|jest\.mock\(\s*|require\(\s*)(['"])([^'"]+)\2/g

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'coverage', 'storybook-static', '.turbo'])

const walk = (target) => {
  const stats = statSync(target)
  if (stats.isFile()) return SOURCE_EXTENSIONS.has(path.extname(target)) ? [target] : []
  return readdirSync(target).flatMap((entry) => (SKIP_DIRS.has(entry) ? [] : walk(path.join(target, entry))))
}

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const roots = args.filter((arg) => !arg.startsWith('--'))

if (roots.length === 0) {
  console.error('usage: migrate-design-system [--dry] <path> [<path> …]')
  process.exit(1)
}

const counts = new Map()
const touched = []

for (const file of roots.flatMap(walk)) {
  const source = readFileSync(file, 'utf8')
  const next = source.replace(SPECIFIER_SITE, (match, prefix, quote, specifier) => {
    const replacement = rewriteSpecifier(specifier)
    if (!replacement) return match
    counts.set(specifier, (counts.get(specifier) ?? 0) + 1)
    return `${prefix}${quote}${replacement}${quote}`
  })

  if (next !== source) {
    touched.push(file)
    if (!dry) writeFileSync(file, next)
  }
}

const total = [...counts.values()].reduce((sum, n) => sum + n, 0)
for (const [specifier, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  console.log(`${String(n).padStart(5)}  ${specifier}`)
}
console.log(`\n${dry ? 'would rewrite' : 'rewrote'} ${total} specifier(s) across ${touched.length} file(s)`)

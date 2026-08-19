import * as fs from 'fs'
import * as path from 'path'

const REPO_ROOT = path.resolve(__dirname, '../../../..')
const WEB_ROOT = path.resolve(__dirname, '../..')
const MANIFEST = 'apps/web/scripts/github/ci-env-manifest.json'

const WORKFLOWS = [
  'web-deploy-dev.yml',
  'web-tag-release.yml',
  'web-nextjs-bundle-analysis.yml',
  'web-e2e-smoke.yml',
  'web-e2e-full-ondemand.yml',
  'web-e2e-hp-ondemand.yml',
  'web-argos-e2e.yml',
]

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '__tests__', '__mocks__'])
const IGNORED_FILE_PATTERN = /\.(test|spec|stories)\.[a-z]+$/

interface Manifest {
  githubSecrets: string[]
  defaultsOnly: string[]
  buildTime: string[]
}

const manifest: Manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'ci-env-manifest.json'), 'utf8'))

const collectSourceFiles = (dir: string, out: string[]): void => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        collectSourceFiles(path.join(dir, entry.name), out)
      }
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name)) && !IGNORED_FILE_PATTERN.test(entry.name)) {
      out.push(path.join(dir, entry.name))
    }
  }
}

const codeReferencedVars = (): Set<string> => {
  const files: string[] = []
  collectSourceFiles(path.join(WEB_ROOT, 'src'), files)
  collectSourceFiles(path.join(REPO_ROOT, 'packages'), files)
  files.push(path.join(WEB_ROOT, 'next.config.mjs'))

  const vars = new Set<string>()
  for (const file of files) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
      vars.add(match[0])
    }
  }
  return vars
}

const workflowEnvVars = (workflow: string): Map<string, string> => {
  const content = fs.readFileSync(path.join(REPO_ROOT, '.github/workflows', workflow), 'utf8')
  const entries = new Map<string, string>()
  for (const match of content.matchAll(/^\s+(NEXT_PUBLIC_[A-Z0-9_]+): (.+)$/gm)) {
    entries.set(match[1], match[2])
  }
  return entries
}

const report = (hint: string, problems: string[]): string =>
  problems.length === 0 ? '' : `${hint}\n  - ${problems.sort().join('\n  - ')}`

describe('CI build env consistency', () => {
  const codeVars = codeReferencedVars()
  const perWorkflow = new Map(WORKFLOWS.map((w) => [w, workflowEnvVars(w)]))
  const enumerated = new Set(perWorkflow.get(WORKFLOWS[0])!.keys())

  it('enumerates the same NEXT_PUBLIC_* set in every workflow', () => {
    const problems: string[] = []
    for (const [workflow, entries] of perWorkflow) {
      const missing = [...enumerated].filter((v) => !entries.has(v))
      const extra = [...entries.keys()].filter((v) => !enumerated.has(v))
      if (missing.length > 0) problems.push(`${workflow} is missing: ${missing.join(', ')}`)
      if (extra.length > 0) problems.push(`${workflow} has extra: ${extra.join(', ')}`)
    }
    expect(report(`Workflow env blocks diverged (baseline: ${WORKFLOWS[0]})`, problems)).toBe('')
  })

  it('maps every workflow entry to the same-named secret', () => {
    const problems: string[] = []
    for (const [workflow, entries] of perWorkflow) {
      for (const [name, value] of entries) {
        if (value !== `\${{ secrets.${name} }}`) problems.push(`${workflow}: ${name}: ${value}`)
      }
    }
    expect(report('Env entries must be `NAME: ${{ secrets.NAME }}`', problems)).toBe('')
  })

  it('passes every NEXT_PUBLIC_* var read in code to the CI build, unless allowlisted in the manifest', () => {
    const known = new Set([...enumerated, ...manifest.defaultsOnly, ...manifest.buildTime])
    const missing = [...codeVars].filter((v) => !known.has(v))
    expect(
      report(`Read in code but not passed to CI builds — add to every workflow env block or to ${MANIFEST}`, missing),
    ).toBe('')
  })

  it('enumerates every consumed GitHub secret from the manifest in the workflows', () => {
    const missing = manifest.githubSecrets.filter((s) => !enumerated.has(s))
    expect(report('In githubSecrets but missing from the workflow env blocks', missing)).toBe('')
  })

  it('has no workflow entries that neither code nor the resolve script consume', () => {
    const scriptConsumed = new Set(
      [
        ...fs
          .readFileSync(path.join(__dirname, 'resolve-web-build-env.sh'), 'utf8')
          .matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g),
      ].map((m) => m[0]),
    )
    const dead = [...enumerated].filter((v) => !codeVars.has(v) && !scriptConsumed.has(v))
    expect(report('Passed by the workflows but nothing consumes them — remove', dead)).toBe('')
  })

  it('keeps the manifest lists disjoint', () => {
    const all = [...manifest.githubSecrets, ...manifest.defaultsOnly, ...manifest.buildTime]
    const duplicates = all.filter((v, i) => all.indexOf(v) !== i)
    const wired = manifest.defaultsOnly.filter((v) => enumerated.has(v))
    expect(report('Listed in more than one manifest section', duplicates)).toBe('')
    expect(report('In defaultsOnly but passed by the workflows — move to githubSecrets', wired)).toBe('')
  })
})

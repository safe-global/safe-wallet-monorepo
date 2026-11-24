/**
 * A pull request releases a flag when it changes the flag to `"enabled": true` in apps/web/config/remote-config.json.
 * CI then runs the specs that cover the flag several times and posts a checklist for the reviewer.
 */
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { playwrightSpecs } from './playwright-specs.mjs'

export const BURN_IN_REPEATS = 5

const declarationPath = new URL('../../config/remote-config.json', import.meta.url)
const reasonsPath = new URL('./released-without-e2e.json', import.meta.url)

/** The flags that `head` enables and `base` does not, in the order of `head` */
export function releasedFlags(base, head) {
  const enabledBefore = new Set(base.features.filter((flag) => flag.enabled).map((flag) => flag.key))
  return head.features.filter((flag) => flag.enabled && !enabledBefore.has(flag.key))
}

/** The registered specs whose `flags` name a key of `keys` */
export function specsForFlags(keys, registry = playwrightSpecs) {
  return Object.keys(registry).filter((spec) => (registry[spec].flags ?? []).some((key) => keys.includes(key)))
}

/** A `SAFE_E2E_SPECS` value that selects exactly `specs`: Playwright reads each filter as a regular expression */
export function specsFilter(specs) {
  return specs.map((spec) => spec.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(',')
}

function coverage(flag, registry, reasons) {
  const specs = specsForFlags([flag.key], registry)
  if (specs.length) return specs.map((spec) => `\`${spec}\``).join(', ')
  return `No spec. Reason: ${reasons[flag.key] ?? 'none given'}`
}

function chainsCell(flag) {
  if (flag.scope === 'GLOBAL') return 'All chains'
  return flag.defaultChains?.length ? flag.defaultChains.join(', ') : 'None, chosen in the admin'
}

/** The pull request comment that lists the released flags and what the reviewer must confirm */
export function releaseComment(released, { registry = playwrightSpecs, reasons = {}, runUrl = '' } = {}) {
  if (!released.length) return ''
  const rows = released.map(
    (flag) => `| \`${flag.key}\` | ${flag.scope} | ${chainsCell(flag)} | ${coverage(flag, registry, reasons)} |`,
  )
  const run = runUrl ? `[this run](${runUrl})` : 'this run'
  const lines = [
    '### Flag release checklist',
    '',
    'This pull request releases feature flags: it changes `enabled` to `true` in `apps/web/config/remote-config.json`.',
    'After the release, reconcile in the Config Service shows an `ADD` for each of them.',
    '',
    '| Flag | Scope | Chains at release | E2E coverage |',
    '| --- | --- | --- | --- |',
    ...rows,
    '',
  ]
  if (
    specsForFlags(
      released.map((flag) => flag.key),
      registry,
    ).length
  ) {
    lines.push(
      `The \`playwright burnin\` job of ${run} runs the covering specs ${BURN_IN_REPEATS} times.`,
      'If one run fails, `Isolated E2E result` fails.',
      '',
    )
  }
  if (released.some((flag) => flag.scope === 'GLOBAL')) {
    lines.push('A `GLOBAL` flag goes on for all chains when the operator applies its `ADD`.', '')
  }
  lines.push(
    'Before you approve, confirm:',
    '',
    '- [ ] QA tested the feature on staging.',
    '- [ ] Jest covers the state with the flag off.',
    '- [ ] The feature sends the analytics events it needs.',
    '- [ ] The plan to remove the flag after the rollout is written down.',
  )
  return lines.join('\n')
}

/** GitHub Actions step outputs: the burn-in filter and the comment for the flags that this pull request releases */
export function releaseOutputs(baseDeclarationPath, env = process.env) {
  const base = JSON.parse(readFileSync(baseDeclarationPath, 'utf8'))
  const head = JSON.parse(readFileSync(declarationPath, 'utf8'))
  const reasons = JSON.parse(readFileSync(reasonsPath, 'utf8'))
  const released = releasedFlags(base, head)
  const specs = specsForFlags(released.map((flag) => flag.key))
  const runUrl =
    env.GITHUB_SERVER_URL && env.GITHUB_RUN_ID
      ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
      : ''
  const comment = releaseComment(released, { reasons, runUrl })
  if (!comment) return 'specs=\ncomment='
  // A random delimiter, so that no release reason in the comment can end the output early.
  const delimiter = `FLAG_RELEASE_${randomUUID()}`
  return `specs=${specsFilter(specs)}\ncomment<<${delimiter}\n${comment}\n${delimiter}`
}

import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { releaseComment, releasedFlags, releaseOutputs, specsFilter, specsForFlags } from './flag-release.mjs'
import { selectPlaywrightSpecs } from './run.mjs'

const flag = (key, enabled, extra = {}) => ({
  key,
  description: key,
  scope: 'PER_CHAIN',
  enabled,
  defaultChains: [],
  ...extra,
})

test('releases a flag that changes to enabled or arrives enabled, but not one that stays enabled or off', () => {
  const base = { features: [flag('FLIPPED', false), flag('STAYS_ON', true), flag('STAYS_OFF', false)] }
  const head = {
    features: [flag('FLIPPED', true), flag('STAYS_ON', true), flag('STAYS_OFF', false), flag('NEW_ON', true)],
  }
  assert.deepEqual(
    releasedFlags(base, head).map((released) => released.key),
    ['FLIPPED', 'NEW_ON'],
  )
})

test('does not release a flag that a pull request turns off', () => {
  assert.deepEqual(releasedFlags({ features: [flag('X', true)] }, { features: [flag('X', false)] }), [])
})

test('finds the specs that cover any of the flags', () => {
  const registry = {
    'e2e/a.spec.ts': { flags: ['A'] },
    'e2e/ab.spec.ts': { flags: ['A', 'B'] },
    'e2e/none.spec.ts': {},
  }
  assert.deepEqual(specsForFlags(['B'], registry), ['e2e/ab.spec.ts'])
  assert.deepEqual(specsForFlags(['A'], registry), ['e2e/a.spec.ts', 'e2e/ab.spec.ts'])
  assert.deepEqual(specsForFlags(['C'], registry), [])
})

test('builds a filter that selects only the given specs, not specs that share a prefix', () => {
  const registry = { 'e2e/walletconnect.spec.ts': {}, 'e2e/walletconnect-nested-signer.spec.ts': {} }
  const filter = specsFilter(['e2e/walletconnect.spec.ts'])
  assert.deepEqual(selectPlaywrightSpecs({ SAFE_E2E_SPECS: filter }, registry), ['e2e/walletconnect.spec.ts'])
})

test('lists each released flag with its coverage, or the reason when no spec covers it', () => {
  const registry = { 'e2e/a.spec.ts': { flags: ['COVERED'] } }
  const comment = releaseComment([flag('COVERED', true, { defaultChains: ['1'] }), flag('BARE', true)], {
    registry,
    reasons: { BARE: 'QA tested it by hand' },
    runUrl: 'https://example.test/run',
  })
  assert.match(comment, /\| `COVERED` \| PER_CHAIN \| 1 \| `e2e\/a\.spec\.ts` \|/)
  assert.match(
    comment,
    /\| `BARE` \| PER_CHAIN \| None, chosen in the admin \| No spec\. Reason: QA tested it by hand \|/,
  )
  assert.match(comment, /\[this run\]\(https:\/\/example\.test\/run\) runs the covering specs 5 times/)
  assert.match(comment, /- \[ \] QA tested the feature on staging\./)
})

test('warns that a GLOBAL flag goes on for all chains and says nothing of a burn-in without specs', () => {
  const comment = releaseComment([flag('G', true, { scope: 'GLOBAL' })], { registry: {} })
  assert.match(comment, /\| `G` \| GLOBAL \| All chains \|/)
  assert.match(comment, /goes on for all chains/)
  assert.doesNotMatch(comment, /burnin/)
})

test('writes no comment when nothing is released', () => {
  assert.equal(releaseComment([]), '')
})

test('writes empty step outputs when the head declaration releases nothing new', () => {
  const dir = mkdtempSync(join(tmpdir(), 'flag-release-'))
  const base = join(dir, 'base.json')
  writeFileSync(base, readFileSync(new URL('../../config/remote-config.json', import.meta.url)))
  assert.equal(releaseOutputs(base, {}), 'specs=\ncomment=')
})

test('writes the burn-in filter and the comment when the head declaration releases a covered flag', () => {
  const head = JSON.parse(readFileSync(new URL('../../config/remote-config.json', import.meta.url), 'utf8'))
  const base = {
    ...head,
    features: head.features.map((entry) => (entry.key === 'DOMAIN_LOOKUP' ? { ...entry, enabled: false } : entry)),
  }
  const path = join(mkdtempSync(join(tmpdir(), 'flag-release-')), 'base.json')
  writeFileSync(path, JSON.stringify(base))
  const outputs = releaseOutputs(path, {
    GITHUB_SERVER_URL: 'https://github.com',
    GITHUB_REPOSITORY: 'org/repo',
    GITHUB_RUN_ID: '7',
  })
  assert.match(outputs, /^specs=e2e\/ens\\\.spec\\\.ts\ncomment<<FLAG_RELEASE\n### Flag release checklist\n/)
  assert.match(outputs, /\| `DOMAIN_LOOKUP` \|/)
  assert.match(outputs, /\(https:\/\/github\.com\/org\/repo\/actions\/runs\/7\)/)
  assert.match(outputs, /\nFLAG_RELEASE$/)
})

import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import { scenarios } from './scenarios/index.mjs'
import { playwrightSpecs } from './playwright-specs.mjs'
import { isolatedSpecs } from './specs.mjs'

const specFile = (spec) => new URL(`../../${spec}`, import.meta.url)

test('every registered spec exists and names a scenario function', () => {
  for (const [spec, { scenario }] of Object.entries(isolatedSpecs)) {
    assert.ok(existsSync(specFile(spec)), `${spec} does not exist`)
    assert.equal(typeof scenarios[scenario], 'function', `${spec} names unknown scenario ${scenario}`)
  }
})

test('every scenario function serves at least one Cypress or Playwright spec', () => {
  const used = new Set([
    ...Object.values(isolatedSpecs).map(({ scenario }) => scenario),
    ...Object.values(playwrightSpecs).flatMap(({ scenarios = [] }) => scenarios),
  ])
  assert.deepEqual(
    Object.keys(scenarios).filter((name) => !used.has(name)),
    [],
  )
})

test('extra forks are the ones the stack can start', () => {
  for (const [spec, { chains = [] }] of Object.entries(isolatedSpecs)) {
    assert.ok(
      chains.every((chainId) => [1, 137].includes(chainId)),
      spec,
    )
  }
})

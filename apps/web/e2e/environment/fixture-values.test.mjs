import assert from 'node:assert/strict'
import { test } from 'node:test'
import { aliasedStorage, fixtureValue, storageFixture } from '../../cypress/support/fixture.js'
import rejectionTransactions from '../../cypress/fixtures/rejection-transactions.js'
import { setSafeScenario } from '../../cypress/support/safes/safesHandler.js'

function fixtureEnvironment(t) {
  const env = {}
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Cypress')
  Object.defineProperty(globalThis, 'Cypress', {
    configurable: true,
    value: {
      expose(key, ...values) {
        if (values.length) env[key] = values[0]
        return env[key]
      },
    },
  })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'Cypress', previous)
    else delete globalThis.Cypress
  })
}

test('keeps existing fixture values when setup has not supplied an override', (t) => {
  fixtureEnvironment(t)
  assert.equal(fixtureValue('transaction', 'existing'), 'existing')
  assert.match(rejectionTransactions.executed, /^&id=multisig_0x5912f661/)
  assert.match(rejectionTransactions.pending, /^&id=multisig_0x4B8A8Ca9/)
})

test('resolves generated identifiers at read time across setup and resets', (t) => {
  fixtureEnvironment(t)
  const original = rejectionTransactions.executed
  setSafeScenario({ safes: {}, fixtures: { 'rejection.executed': '&id=first' } })
  assert.equal(rejectionTransactions.executed, '&id=first')
  setSafeScenario({ safes: {}, fixtures: { 'rejection.executed': '&id=next' } })
  assert.equal(rejectionTransactions.executed, '&id=next')
  setSafeScenario({ safes: {} })
  assert.equal(rejectionTransactions.executed, original)
})

test('preserves false, zero and empty-string fixture values', (t) => {
  fixtureEnvironment(t)
  setSafeScenario({ safes: {}, fixtures: { enabled: false, amount: 0, name: '' } })
  assert.equal(fixtureValue('enabled', true), false)
  assert.equal(fixtureValue('amount', 10), 0)
  assert.equal(fixtureValue('name', 'default'), '')
})

test('serializes captured storage fixtures using setup data while preserving ordinary defaults', (t) => {
  fixtureEnvironment(t)
  const original = { 11155111: { original: { threshold: 1 } } }
  const captured = { saved: storageFixture('undeployedSafes', original) }
  assert.deepEqual(JSON.parse(JSON.stringify(captured)), { saved: original })
  const prepared = { 11155111: { generated: { threshold: 2 } } }
  setSafeScenario({ safes: {}, fixtures: { undeployedSafes: prepared } })
  assert.deepEqual(JSON.parse(JSON.stringify(captured)), { saved: prepared })
  assert.deepEqual(Object.keys(captured.saved), ['11155111'])
  assert.deepEqual(original, { 11155111: { original: { threshold: 1 } } })
  setSafeScenario({ safes: {} })
  assert.deepEqual(JSON.parse(JSON.stringify(captured)), { saved: original })
})

test('maps staging static Safe addresses to the Safes prepared under the same keys', (t) => {
  fixtureEnvironment(t)
  const staging = '0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415'
  const local = '0x00000000000000000000000000000000000000bB'
  const captured = aliasedStorage({ 11155111: { [staging]: 'Batch Safe' } })
  assert.deepEqual(JSON.parse(JSON.stringify(captured)), { 11155111: { [staging]: 'Batch Safe' } })
  setSafeScenario({ safes: { static: { SEP_STATIC_SAFE_2: `sep:${local}` } } })
  assert.deepEqual(JSON.parse(JSON.stringify(captured)), { 11155111: { [local]: 'Batch Safe' } })
})

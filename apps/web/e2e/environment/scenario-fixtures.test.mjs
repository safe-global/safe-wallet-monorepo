import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CATEGORIES, getSafes, setSafeScenario } from '../../cypress/support/safes/safesHandler.js'

async function fixtureRunner(t, spec, isolated = true) {
  const env = { SAFE_E2E_ISOLATED: isolated }
  const hooks = { before: [], beforeEach: [] }
  const calls = []
  let prepare = async () => ({
    safes: { static: { SEP_STATIC_SAFE_2: `safe-${calls.length}` }, nfts: { NFT_SAFE: `nft-${calls.length}` } },
  })
  const globals = {
    Cypress: {
      env(key, ...values) {
        if (values.length) env[key] = values[0]
        return env[key]
      },
      spec: { relative: spec },
    },
    cy: {
      task(name, path, options) {
        calls.push({ name, path, options })
        return prepare()
      },
      fixture: async (path) => ({ source: path }),
    },
    before: (hook) => hooks.before.push(hook),
    beforeEach: (hook) => hooks.beforeEach.push(hook),
  }
  for (const [key, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
    t.after(() => {
      if (previous) Object.defineProperty(globalThis, key, previous)
      else delete globalThis[key]
    })
  }
  setSafeScenario({ safes: {} })
  await import(`../../cypress/support/safes/isolated.js?case=${encodeURIComponent(t.name)}`)
  // Mocha calls hooks with the current test as `this`; `skip` throws like Mocha's pending marker.
  const runBeforeEach = async (title = 'a test') => {
    const context = {
      currentTest: { title },
      skip: () => {
        throw new Error(`skipped ${title}`)
      },
    }
    return Promise.all(hooks.beforeEach.map((hook) => hook.call(context)))
  }
  return { env, hooks, calls, runBeforeEach, setPrepare: (callback) => (prepare = callback) }
}

test('prepares once before spec hooks and reads multiple fixture categories without further tasks', async (t) => {
  const runner = await fixtureRunner(t, 'cypress/e2e/regression/assets.cy.js')
  assert.throws(() => getSafes(CATEGORIES.static), /No prepared isolated Safes/)
  await runner.hooks.before[0]()
  const lookup = getSafes(CATEGORIES.static)
  assert.ok(lookup instanceof Promise)
  assert.equal((await lookup).SEP_STATIC_SAFE_2, 'safe-1')
  assert.equal((await getSafes(CATEGORIES.nfts)).NFT_SAFE, 'nft-1')
  assert.strictEqual(await getSafes(CATEGORIES.static), await lookup)
  assert.deepEqual(runner.calls, [
    { name: 'prepareSafeScenario', path: 'cypress/e2e/regression/assets.cy.js', options: { log: false } },
  ])
  await runner.runBeforeEach()
  await runner.runBeforeEach()
  assert.equal(runner.calls.length, 1)
})

test('refreshes mutable scenarios between tests and retries while retaining spec fixture references', async (t) => {
  const runner = await fixtureRunner(t, 'cypress/e2e/regression/remove_owner.cy.js')
  await runner.hooks.before[0]()
  const safes = await getSafes(CATEGORIES.static)
  await runner.runBeforeEach()
  assert.equal(runner.calls.length, 1)
  await runner.runBeforeEach()
  assert.equal(safes.SEP_STATIC_SAFE_2, 'safe-2')
  await runner.runBeforeEach()
  assert.equal(safes.SEP_STATIC_SAFE_2, 'safe-3')
})

test('shares prepared fixtures between separately bundled support and spec modules', async (t) => {
  const runner = await fixtureRunner(t, 'cypress/e2e/regression/remove_owner.cy.js')
  const specModule = await import('../../cypress/support/safes/safesHandler.js?spec-bundle')
  await runner.hooks.before[0]()
  const safes = await specModule.getSafes(CATEGORIES.static)
  assert.equal(safes.SEP_STATIC_SAFE_2, 'safe-1')
  await runner.runBeforeEach()
  await runner.runBeforeEach()
  assert.equal(safes.SEP_STATIC_SAFE_2, 'safe-2')
  assert.strictEqual(safes, await getSafes(CATEGORIES.static))
})

test('removes stale Safe keys and categories on reset', async (t) => {
  await fixtureRunner(t, 'cypress/e2e/regression/assets.cy.js')
  setSafeScenario({ safes: { static: { OLD: 'old' }, nfts: { NFT: 'old' } } })
  const statics = await getSafes(CATEGORIES.static)
  const nfts = await getSafes(CATEGORIES.nfts)
  setSafeScenario({ safes: { static: { NEW: 'new' } } })
  assert.deepEqual(statics, { NEW: 'new' })
  assert.deepEqual(nfts, {})
  assert.throws(() => getSafes(CATEGORIES.nfts), /No prepared isolated Safes/)
})

test('skips only the listed cases of a spec and keeps its other tests', async (t) => {
  const runner = await fixtureRunner(t, 'cypress/e2e/regression/recovery.cy.js')
  const skipped = 'Verify that the Security section contains Account recovery block on supported netwroks'
  await assert.rejects(runner.runBeforeEach(skipped), /skipped/)
  await runner.runBeforeEach('Verify that the recovery setup flow starts')
})

test('waits for setup and propagates backend failures instead of loading hosted fixtures', async (t) => {
  const runner = await fixtureRunner(t, 'cypress/e2e/regression/assets.cy.js')
  let finish
  runner.setPrepare(() => new Promise((resolve) => (finish = resolve)))
  const pending = runner.hooks.before[0]()
  assert.throws(() => getSafes(CATEGORIES.static), /No prepared isolated Safes/)
  finish({ safes: { static: { READY: 'ready' } } })
  await pending
  assert.deepEqual(await getSafes(CATEGORIES.static), { READY: 'ready' })
  runner.setPrepare(async () => {
    throw new Error('Indexing failed')
  })
  await assert.rejects(runner.hooks.before[0](), /Indexing failed/)
})

test('keeps ordinary Cypress fixture loading and registers no isolated setup hooks', async (t) => {
  const runner = await fixtureRunner(t, 'cypress/e2e/regression/assets.cy.js', false)
  assert.deepEqual(runner.hooks, { before: [], beforeEach: [] })
  const statics = await import('../../cypress/fixtures/safes/static.js')
  assert.strictEqual(await getSafes(CATEGORIES.static), statics.default)
  assert.deepEqual(await getSafes(CATEGORIES.safeapps), { source: 'safes/safeapps.json' })
  assert.throws(() => getSafes('unknown'), /not recognized/)
  assert.equal(runner.calls.length, 0)
})

test('fixture getters read the prepared value and fall back to the staging value', async (t) => {
  const runner = await fixtureRunner(t, 'cypress/e2e/regression/assets.cy.js')
  const { fixtureGetters } = await import('../../cypress/support/fixture.js')
  const notes = fixtureGetters('notes', { safe: 'sep:staging', creator: 'staging creator' })
  runner.env.SAFE_E2E_FIXTURES = { 'notes.safe': 'sep:local' }
  assert.equal(notes.safe, 'sep:local')
  assert.equal(notes.creator, 'staging creator')
  assert.deepEqual(Object.keys(notes), ['safe', 'creator'])
})

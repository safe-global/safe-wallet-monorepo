import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  checkEnvironment,
  configuration,
  cypressOpenArguments,
  cypressRunArguments,
  missingChainCommands,
  planMatrix,
  readManifest,
  walletEnvironment,
} from './run.mjs'
import { fileURLToPath } from 'node:url'

const manifest = { gatewayUrl: 'http://localhost:8000/cgw', chainId: 11155111, forkBlock: 10008682 }

test('runs CI specs in the selected browser and retains artifacts between specs', () => {
  const args = cypressRunArguments(['cypress/e2e/regression/assets.cy.js'], {
    SAFE_E2E_BROWSER: '/opt/chromium/chrome',
    SAFE_E2E_WEB_URL: 'http://localhost:8080',
  })
  assert.equal(args[args.indexOf('--browser') + 1], '/opt/chromium/chrome')
  const config = JSON.parse(args[args.indexOf('--config') + 1])
  assert.equal(config.baseUrl, 'http://localhost:8080')
  assert.equal(config.trashAssetsBeforeRuns, false)
  assert.equal(config.video, true)
  assert.equal(config.videosFolder, 'e2e/environment/artifacts/cypress/videos')
  assert.equal(args[args.indexOf('--record') + 1], 'false')
  assert.equal(args[args.indexOf('--reporter') + 1], 'junit')
  assert.equal(
    args[args.indexOf('--reporter-options') + 1],
    'mochaFile=e2e/environment/artifacts/cypress/reports/[hash].xml,toConsole=true',
  )
})

test('records to Cypress Cloud only with a record key and a build id, one group per shard', () => {
  const specs = ['cypress/e2e/regression/assets.cy.js', 'cypress/e2e/regression/batch_tx.cy.js']
  const unrecorded = cypressRunArguments(specs, { CYPRESS_RECORD_KEY: 'key' })
  assert.equal(unrecorded[unrecorded.indexOf('--record') + 1], 'false')
  const args = cypressRunArguments(specs, { CYPRESS_RECORD_KEY: 'key', SAFE_E2E_RECORD_BUILD_ID: 'run-1' })
  assert.notEqual(args[args.indexOf('--record') + 1], 'false')
  assert.equal(args[args.indexOf('--ci-build-id') + 1], 'run-1')
  assert.equal(args[args.indexOf('--group') + 1], 'isolated shard 1')
  assert.equal(args[args.indexOf('--spec') + 1], specs.join(','))
  const shard = cypressRunArguments(specs, {
    CYPRESS_RECORD_KEY: 'key',
    SAFE_E2E_RECORD_BUILD_ID: 'run-1',
    SAFE_E2E_SHARD: '4',
  })
  assert.equal(shard[shard.indexOf('--group') + 1], 'isolated shard 4')
  assert.equal(args[args.indexOf('--tag') + 1], 'isolated')
})

test('keeps local Chrome defaults and passes the selected specs to interactive Cypress', () => {
  const specs = ['cypress/e2e/regression/assets.cy.js']
  const args = cypressOpenArguments(specs, {})
  assert.equal(args[0], 'cypress:open')
  assert.equal(args[args.indexOf('--browser') + 1], 'chrome')
  const config = JSON.parse(args[args.indexOf('--config') + 1])
  assert.equal(config.baseUrl, 'http://localhost:3080')
  assert.deepEqual(config.specPattern, specs)
  assert.equal(args.includes('--record'), false)
})

test('uses the checked-in backend by default and permits an explicit comparison checkout', () => {
  assert.equal(configuration(['status'], {}).infrastructure, fileURLToPath(new URL('./infra', import.meta.url)))
  assert.equal(configuration(['status'], { SAFE_INFRASTRUCTURE_PATH: '/comparison' }).infrastructure, '/comparison')
})

test('rejects unknown commands and unrelated cleanup projects', () => {
  assert.throws(() => configuration(['erase'], {}), /Usage/)
  assert.throws(() => configuration(['reset'], { SAFE_E2E_PROJECT: 'safe-infrastructure' }), /Invalid/)
  assert.throws(() => configuration(['reset', '--all'], {}), /Usage/)
})

test('assigns each automated check a fresh project', () => {
  const first = configuration(['check'], {})
  assert.match(first.project, /^safe-e2e-/)
  assert.notEqual(first.project, configuration(['check'], {}).project)
  assert.equal(configuration(['status'], {}).project, 'safe-e2e-local')
})

test('keeps the wallet on local CGW and removes fork provider credentials', () => {
  const env = walletEnvironment(manifest, {
    FORK_RPC_URL: 'secret',
    SEPOLIA_FORK_RPC_URL: 'sepolia-secret',
    PATH: '/bin',
    NEXT_PUBLIC_IS_PRODUCTION: 'true',
    ELECTRON_RUN_AS_NODE: '1',
  })
  assert.equal(env.FORK_RPC_URL, undefined)
  assert.equal(env.SEPOLIA_FORK_RPC_URL, undefined)
  assert.equal(env.ELECTRON_RUN_AS_NODE, undefined)
  assert.equal(env.NEXT_PUBLIC_CONFIG_SERVICE_KEY, 'WALLET_WEB')
  assert.equal(env.NEXT_PUBLIC_IS_PRODUCTION, 'false')
  assert.equal(env.NEXT_PUBLIC_GATEWAY_URL_STAGING, manifest.gatewayUrl)
  assert.equal(env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION, manifest.gatewayUrl)
  assert.equal(env.VITE_GATEWAY_URL, manifest.gatewayUrl)
  assert.equal(env.PATH, '/bin')
  assert.throws(() => walletEnvironment({ ...manifest, gatewayUrl: 'https://safe-client.safe.global' }), /local/)
  assert.throws(() => walletEnvironment({ ...manifest, chainId: 1 }), /identity/)
})

test('cleans a partially started stack and preserves the original failure', async () => {
  const calls = []
  const failure = new Error('startup failed')
  await assert.rejects(
    checkEnvironment(async (action) => {
      calls.push(action)
      if (action === 'up') throw failure
      if (action === 'reset') throw new Error('cleanup failed')
    }),
    (error) => error === failure,
  )
  assert.deepEqual(calls, ['up', 'logs', 'reset'])
})

test('runs both backend gates and fails if cleanup fails', async () => {
  const calls = []
  await assert.rejects(
    checkEnvironment(async (action) => {
      calls.push(action)
      if (action === 'reset') throw new Error('cleanup failed')
    }),
    /cleanup failed/,
  )
  assert.deepEqual(calls, ['up', 'test', 'smoke', 'logs', 'reset'])
})

test('names the fork start command for every selected spec whose chain is not running', () => {
  const registry = {
    'cypress/e2e/test/a.cy.js': { chains: [1] },
    'cypress/e2e/test/b.cy.js': { chains: [1, 137] },
    'cypress/e2e/test/sepolia.cy.js': {},
  }
  assert.deepEqual(missingChainCommands(Object.keys(registry), { chains: { 1: {} } }, '/infra', registry), [
    'python3 /infra/scripts/test_env.py up --chain polygon',
  ])
  assert.deepEqual(missingChainCommands(['cypress/e2e/test/sepolia.cy.js'], {}, '/infra', registry), [])
})

test('plans a GitHub Actions matrix with short spec names and the forks of each shard', () => {
  const registry = {
    'cypress/e2e/regression/a.cy.js': { scenario: 'a' },
    'cypress/e2e/regression/b.cy.js': { scenario: 'b', chains: [137] },
  }
  assert.deepEqual(planMatrix(undefined, 2, registry), {
    include: [
      { shard: 1, specs: 'regression/a', chains: '' },
      { shard: 2, specs: 'regression/b', chains: 'polygon' },
    ],
  })
})

test('explains a missing stack instead of failing on the manifest path', async () => {
  const infrastructure = await mkdtemp(join(tmpdir(), 'infra-'))
  await assert.rejects(readManifest(infrastructure, 'safe-e2e-absent'), /No running stack for safe-e2e-absent/)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  checkEnvironment,
  configuration,
  listedSpecs,
  missingStackCommands,
  planMatrix,
  selectPlaywrightSpecs,
  missingShardCommands,
  shardSpecs,
  playwrightRunArguments,
  readManifest,
  stackEnvironment,
  stackNeeds,
  walletEnvironment,
} from './run.mjs'
import { fileURLToPath } from 'node:url'
import { chainProfiles } from './local-stack.mjs'

const manifest = { gatewayUrl: 'http://localhost:8000/cgw', chainId: 11155111, forkBlock: 10008682 }

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
  assert.equal(env.NEXT_PUBLIC_POLLING_INTERVAL, '2000')
  assert.equal(env.NEXT_PUBLIC_GATEWAY_URL_STAGING, manifest.gatewayUrl)
  assert.equal(env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION, manifest.gatewayUrl)
  assert.equal(env.VITE_GATEWAY_URL, manifest.gatewayUrl)
  assert.equal(env.NEXT_PUBLIC_TENDERLY_SIMULATE_ENDPOINT_URL, 'http://localhost:4003/simulate')
  assert.equal(env.NEXT_PUBLIC_TENDERLY_ORG_NAME, 'safe')
  assert.equal(env.NEXT_PUBLIC_TENDERLY_PROJECT_NAME, 'safe-apps')
  assert.equal(env.PATH, '/bin')
  assert.throws(() => walletEnvironment({ ...manifest, gatewayUrl: 'https://safe-client.safe.global' }), /local/)
  assert.throws(() => walletEnvironment({ ...manifest, chainId: 1 }), /identity/)
})

test('points the wallet at the local Ledger emulator when the stack has one', () => {
  const emulator = 'http://localhost:9555'
  assert.equal(
    walletEnvironment({ ...manifest, ledgerEmulatorUrl: emulator }).NEXT_PUBLIC_LEDGER_EMULATOR_URL,
    emulator,
  )
  assert.equal(walletEnvironment(manifest, {}).NEXT_PUBLIC_LEDGER_EMULATOR_URL, undefined)
  assert.throws(() => walletEnvironment({ ...manifest, ledgerEmulatorUrl: 'https://speculos.example' }), /local/)
})

test('gives the Trezor specs the local Trezor emulator when the stack has one', () => {
  const emulator = 'http://localhost:9556'
  assert.equal(walletEnvironment({ ...manifest, trezorEmulatorUrl: emulator }).TREZOR_EMULATOR_URL, emulator)
  assert.equal(walletEnvironment(manifest, {}).TREZOR_EMULATOR_URL, undefined)
  assert.throws(() => walletEnvironment({ ...manifest, trezorEmulatorUrl: 'https://trezor.example' }), /local/)
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

const needsRegistry = {
  'e2e/a.spec.ts': { chains: [1] },
  'e2e/b.spec.ts': { chains: [1, 137], devices: ['trezor'] },
  'e2e/ledger.spec.ts': { devices: ['ledger'] },
  'e2e/sepolia.spec.ts': {},
}

test('names the forks and device emulators that the given specs need, each once', () => {
  assert.deepEqual(stackNeeds(['e2e/a.spec.ts', 'e2e/b.spec.ts'], needsRegistry), {
    chains: ['mainnet', 'polygon'],
    devices: ['trezor'],
  })
  assert.deepEqual(stackNeeds(['e2e/sepolia.spec.ts'], needsRegistry), { chains: [], devices: [] })
})

test('names the start command for every fork and device emulator that selected specs need and the stack lacks', () => {
  const stack = { chains: { 1: {} }, devices: ['ledger'] }
  assert.deepEqual(missingStackCommands(Object.keys(needsRegistry), stack, '/infra', needsRegistry), [
    'python3 /infra/scripts/test_env.py up --chain polygon',
    'python3 /infra/scripts/test_env.py up --device trezor',
  ])
  assert.deepEqual(missingStackCommands(['e2e/sepolia.spec.ts'], {}, '/infra', needsRegistry), [])
})

test('reads the spec files of a Playwright --list report, including nested describe blocks', () => {
  const report = {
    suites: [
      { file: 'e2e/a.spec.ts', specs: [{ title: 'a' }], suites: [] },
      { file: 'e2e/b.spec.ts', specs: [], suites: [{ file: 'e2e/b.spec.ts', specs: [{ title: 'b' }] }] },
      { file: 'e2e/empty.spec.ts', specs: [], suites: [] },
    ],
  }
  assert.deepEqual(listedSpecs(report), ['e2e/a.spec.ts', 'e2e/b.spec.ts'])
  assert.deepEqual(listedSpecs({}), [])
})

test('plans one matrix entry per Playwright shard', () => {
  const registry = { 'e2e/sepolia.spec.ts': {} }
  assert.deepEqual(planMatrix(2, {}, registry), { include: [{ shard: 1 }, { shard: 2 }] })
  for (const count of [0, -1, 1.5, NaN]) {
    assert.throws(() => planMatrix(count, {}, registry), /positive integer/)
  }
})

test('refuses to plan a run whose SAFE_E2E_SPECS filter matches no registered spec', () => {
  const registry = { 'e2e/batch.spec.ts': {} }
  assert.deepEqual(planMatrix(3, { SAFE_E2E_SPECS: 'batch' }, registry).include.length, 3)
  assert.throws(() => planMatrix(3, { SAFE_E2E_SPECS: 'no-such-spec' }, registry), /matches no registered/)
})

test('selects the Playwright specs that SAFE_E2E_SPECS matches, as Playwright does', () => {
  const registry = {
    'e2e/nested-signer.spec.ts': {},
    'e2e/walletconnect-nested-signer.spec.ts': {},
    'e2e/batch.spec.ts': {},
  }
  assert.deepEqual(selectPlaywrightSpecs({}, registry), Object.keys(registry))
  assert.deepEqual(selectPlaywrightSpecs({ SAFE_E2E_SPECS: 'e2e/nested, batch' }, registry), [
    'e2e/nested-signer.spec.ts',
    'e2e/batch.spec.ts',
  ])
})

test('runs every isolated Playwright spec unless SAFE_E2E_SPECS names some', () => {
  const config = ['playwright', 'test', '--config', 'e2e/playwright.isolated.config.ts']
  assert.deepEqual(playwrightRunArguments({}), config)
  assert.deepEqual(playwrightRunArguments({ SAFE_E2E_SPECS: '' }), config)
  assert.deepEqual(playwrightRunArguments({ SAFE_E2E_SPECS: 'dashboard, owners' }), [...config, 'dashboard', 'owners'])
})

test('runs one Playwright shard when SAFE_E2E_SHARD names it', () => {
  const config = ['playwright', 'test', '--config', 'e2e/playwright.isolated.config.ts']
  assert.deepEqual(playwrightRunArguments({ SAFE_E2E_SHARD: '2/3' }), [...config, '--shard', '2/3'])
  assert.deepEqual(playwrightRunArguments({ SAFE_E2E_SHARD: '1/3', SAFE_E2E_SPECS: 'batch' }), [
    ...config,
    '--shard',
    '1/3',
    'batch',
  ])
})

test('gives the Playwright run the local service URLs and the running forks', () => {
  const stack = { ...manifest, transactionServiceUrl: 'http://localhost:8000/txs', rpcUrl: 'http://localhost:8545' }
  const chains = { 137: { rpcUrl: 'http://localhost:8548' } }
  const env = stackEnvironment('safe-e2e-local', { ...stack, chains }, { PATH: '/bin' })
  assert.equal(env.PATH, '/bin')
  assert.equal(env.SAFE_E2E_ISOLATED, 'true')
  assert.equal(env.SAFE_E2E_PROJECT, 'safe-e2e-local')
  assert.equal(env.SAFE_TXS_BASE_URL, 'http://localhost:8000/txs')
  assert.equal(env.SAFE_RPC_URL, 'http://localhost:8545')
  assert.deepEqual(JSON.parse(env.SAFE_E2E_CHAINS), chains)
  assert.equal(stackEnvironment('safe-e2e-local', stack, {}).SAFE_E2E_CHAINS, '{}')
})

test('explains a missing stack instead of failing on the manifest path', async () => {
  const infrastructure = await mkdtemp(join(tmpdir(), 'infra-'))
  await assert.rejects(readManifest(infrastructure, 'safe-e2e-absent'), /No running stack for safe-e2e-absent/)
})

test('accepts a stack that runs exactly the forks and emulators of its own shard', async () => {
  const profileChains = Object.fromEntries(
    Object.entries(chainProfiles).map(([chainId, profile]) => [profile, chainId]),
  )
  for (const shard of ['1/2', '2/2']) {
    const env = { PATH: process.env.PATH, SAFE_E2E_SHARD: shard }
    const { chains, devices } = stackNeeds(await shardSpecs(env))
    const manifest = { chains: Object.fromEntries(chains.map((chain) => [profileChains[chain], {}])), devices }
    assert.deepEqual(await missingShardCommands(env, manifest, '/infra'), [], `shard ${shard}`)
  }
})

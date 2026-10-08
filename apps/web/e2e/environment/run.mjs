import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile, rm } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { planShards, requiredChains, selectCypressSpecs } from './cypress.mjs'
import { assertProjectName, chainProfiles, localUrl } from './local-stack.mjs'
import { isolatedSpecs } from './specs.mjs'

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const cypressArtifacts = 'e2e/environment/artifacts/cypress'
const walletActions = ['dev', 'build', 'cypress', 'cypress-open']
const actions = new Set(['up', 'down', 'reset', 'status', 'logs', 'config', 'test', 'smoke', 'indexing', 'check'])
for (const action of [...walletActions, 'plan']) actions.add(action)

// Each check gets its own project, so it never touches an interactive stack.
const defaultProject = (action) => (action === 'check' ? `safe-e2e-${randomUUID()}` : 'safe-e2e-local')

export function configuration(args, env = process.env) {
  const [action = 'status', ...extra] = args
  if (!actions.has(action) || extra.length) {
    throw new Error(`Usage: e2e:env ${[...actions].join('|')}`)
  }
  const infrastructure = resolve(env.SAFE_INFRASTRUCTURE_PATH || resolve(webRoot, 'e2e/environment/infra'))
  const project = assertProjectName(env.SAFE_E2E_PROJECT || defaultProject(action))
  return { action, infrastructure, project, envFile: env.SAFE_E2E_ENV_FILE && resolve(env.SAFE_E2E_ENV_FILE) }
}

export function walletEnvironment(manifest, env = process.env) {
  const gatewayUrl = localUrl(manifest.gatewayUrl, 'Isolated wallet gateway')
  if (manifest.chainId !== 11155111 || !Number.isSafeInteger(manifest.forkBlock) || manifest.forkBlock <= 0) {
    throw new Error('Unsupported fork identity')
  }
  const filtered = Object.fromEntries(
    Object.entries(env).filter(
      ([key]) => !key.startsWith('FORK_') && key !== 'SEPOLIA_FORK_RPC_URL' && key !== 'ELECTRON_RUN_AS_NODE',
    ),
  )
  return {
    ...filtered,
    NEXT_PUBLIC_IS_PRODUCTION: 'false',
    NEXT_PUBLIC_IS_TEST_E2E: 'true',
    NEXT_PUBLIC_CONFIG_SERVICE_KEY: 'WALLET_WEB',
    NEXT_PUBLIC_GATEWAY_URL_STAGING: gatewayUrl,
    NEXT_PUBLIC_GATEWAY_URL_PRODUCTION: gatewayUrl,
    SAFE_CGW_BASE_URL: gatewayUrl,
    VITE_GATEWAY_URL: gatewayUrl,
  }
}

export async function readManifest(infrastructure, project) {
  const path = resolve(infrastructure, '.test-runs', `${project}.json`)
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    throw new Error(`No running stack for ${project}; start it with e2e:env up`, { cause: error })
  }
}

export async function assertEnvironmentReady(manifest) {
  const gateway = await fetch(`${manifest.gatewayUrl}/health/ready`, { signal: AbortSignal.timeout(5000) })
  if (!gateway.ok) throw new Error('Local gateway is not ready')
  if (!manifest.decoderUrl) {
    throw new Error('Local manifest is missing the decoder URL; refresh it after upgrading the stack')
  }
  const decoderUrl = localUrl(manifest.decoderUrl, 'Decoder readiness URL')
  const response = await fetch(`${decoderUrl}/health/ready`, { signal: AbortSignal.timeout(5000) })
  if (!response.ok || !(await response.json()).ready) throw new Error('Local decoder is not ready')
  await assertForkReady(manifest)
  for (const chain of Object.values(manifest.chains ?? {})) await assertForkReady(chain)
}

async function forkIdentity(rpcUrl, forkBlock) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      { jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] },
      { jsonrpc: '2.0', id: 2, method: 'eth_getBlockByNumber', params: [`0x${forkBlock.toString(16)}`, false] },
    ]),
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error(`RPC answered ${response.status}`)
  const results = await response.json()
  if (!Array.isArray(results)) throw new Error('RPC answered without a batch')
  return {
    chainId: Number(results.find(({ id }) => id === 1)?.result),
    blockHash: results.find(({ id }) => id === 2)?.result?.hash?.toLowerCase(),
  }
}

async function assertForkReady(fork) {
  const rpcUrl = localUrl(fork.rpcUrl, 'Anvil readiness RPC')
  let identity
  try {
    identity = await forkIdentity(rpcUrl, fork.forkBlock)
  } catch (error) {
    const hint = 'inspect e2e:env status/logs and reset the whole stack after a crash'
    throw new Error(`Local Anvil for chain ${fork.chainId} is not ready; ${hint}`, { cause: error })
  }
  if (
    identity.chainId !== fork.chainId ||
    !fork.forkBlockHash ||
    identity.blockHash !== fork.forkBlockHash.toLowerCase()
  ) {
    throw new Error(`Local Anvil for chain ${fork.chainId} does not match the configured fork`)
  }
}

export function missingChainCommands(specs, manifest, infrastructure, registry = isolatedSpecs) {
  return requiredChains(specs, registry)
    .filter((chainId) => !manifest.chains?.[chainId])
    .map((chainId) => `python3 ${infrastructure}/scripts/test_env.py up --chain ${chainProfiles[chainId]}`)
}

const specName = (spec) => spec.replace(/^cypress\/e2e\/|\.cy\.js$/g, '')

/** The GitHub Actions matrix for the selected specs; each shard lists its specs and the forks they need. */
export function planMatrix(selection, shardCount, registry = isolatedSpecs) {
  const shards = planShards(selectCypressSpecs(selection, registry), shardCount, registry)
  return {
    include: shards.map(({ specs, chains }, index) => ({
      shard: index + 1,
      specs: specs.map(specName).join(','),
      chains: chains.join(' '),
    })),
  }
}

// Cypress Cloud accepts one process per group in a build, and each shard runs one process.
function recordArguments(env) {
  if (!env.CYPRESS_RECORD_KEY || !env.SAFE_E2E_RECORD_BUILD_ID) return ['--record', 'false']
  const group = `isolated shard ${env.SAFE_E2E_SHARD || 1}`
  return ['--record', '--ci-build-id', env.SAFE_E2E_RECORD_BUILD_ID, '--group', group, '--tag', 'isolated']
}

const cypressConfig = (env, extra) =>
  JSON.stringify({
    baseUrl: env.SAFE_E2E_WEB_URL || `http://localhost:${env.SAFE_E2E_WEB_PORT || '3080'}`,
    retries: 0,
    video: true,
    trashAssetsBeforeRuns: false,
    videosFolder: `${cypressArtifacts}/videos`,
    ...extra,
  })

export function cypressRunArguments(specs, env = process.env) {
  return [
    'cypress:run',
    '--browser',
    env.SAFE_E2E_BROWSER || 'chrome',
    '--config',
    cypressConfig(env, {}),
    '--spec',
    specs.join(','),
    ...recordArguments(env),
    '--reporter',
    'junit',
    '--reporter-options',
    `mochaFile=${cypressArtifacts}/reports/[hash].xml,toConsole=true`,
  ]
}

export function cypressOpenArguments(specs, env = process.env) {
  return [
    'cypress:open',
    '--browser',
    env.SAFE_E2E_BROWSER || 'chrome',
    '--config',
    cypressConfig(env, { specPattern: specs }),
  ]
}

export async function checkEnvironment(run, diagnostics = () => {}) {
  let failure
  try {
    await run('up')
    await run('test')
    await run('smoke')
  } catch (error) {
    failure = error
  } finally {
    try {
      await run('logs')
    } catch (error) {
      diagnostics(error)
    }
    try {
      await run('reset')
    } catch (error) {
      if (!failure) failure = error
      else diagnostics(error)
    }
  }
  if (failure) throw failure
}

/** Runs child processes in their own process group, so SIGINT/SIGTERM stops the whole tree. */
function createProcessRunner() {
  let child
  let interrupted = false
  const stop = () => {
    if (interrupted) return
    interrupted = true
    if (child?.pid) process.kill(-child.pid, 'SIGTERM')
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  const execute = (command, args, options = {}) =>
    new Promise((accept, reject) => {
      child = spawn(command, args, { stdio: 'inherit', cwd: webRoot, detached: true, ...options })
      child.once('error', reject)
      child.once('exit', (code, signal) => {
        child = undefined
        if (code === 0) accept()
        else reject(new Error(`${command} failed (${signal || code})`))
      })
    })
  const dispose = () => {
    process.off('SIGINT', stop)
    process.off('SIGTERM', stop)
  }
  return { execute, isInterrupted: () => interrupted, dispose }
}

function stackRunner(config, runner) {
  const script = resolve(config.infrastructure, 'scripts/test_env.py')
  if (!existsSync(script)) {
    throw new Error(
      'Isolated backend scripts not found; check the environment/infra directory or SAFE_INFRASTRUCTURE_PATH',
    )
  }
  const envFile = config.envFile ? ['--env-file', config.envFile] : []
  return (action) => {
    if (runner.isInterrupted() && !['logs', 'reset'].includes(action)) throw new Error('Environment run interrupted')
    return runner.execute('python3', [script, action, '--project', config.project, ...envFile])
  }
}

async function runCypress(config, runner, manifest, walletEnv) {
  const specs = selectCypressSpecs(process.env.SAFE_E2E_SPECS)
  const missing = missingChainCommands(specs, manifest, config.infrastructure)
  if (missing.length) {
    throw new Error(`Selected specs need forks that are not running. Start them with:\n${missing.join('\n')}`)
  }
  const env = {
    ...walletEnv,
    SAFE_E2E_ISOLATED: 'true',
    SAFE_E2E_PROJECT: config.project,
    SAFE_TXS_BASE_URL: manifest.transactionServiceUrl,
    SAFE_RPC_URL: manifest.rpcUrl,
    SAFE_E2E_CHAINS: JSON.stringify(manifest.chains ?? {}),
  }
  if (config.action === 'cypress-open') {
    await runner.execute('yarn', cypressOpenArguments(specs, env), { env })
    return
  }
  await rm(resolve(webRoot, cypressArtifacts), { recursive: true, force: true })
  // One process for the whole shard: Cypress starts once, and browser memory management clears between specs.
  await runner.execute('yarn', cypressRunArguments(specs, env), { env })
}

async function runWalletAction(config, runner) {
  const manifest = await readManifest(config.infrastructure, config.project)
  const env = { ...walletEnvironment(manifest), PORT: process.env.SAFE_E2E_WEB_PORT || '3080' }
  await assertEnvironmentReady(manifest)
  if (config.action.startsWith('cypress')) await runCypress(config, runner, manifest, env)
  else await runner.execute('yarn', [config.action], { env })
}

async function runCheck(config, runner) {
  if (process.env.SAFE_E2E_PROJECT) {
    throw new Error('check creates its own project; unset SAFE_E2E_PROJECT to protect interactive stacks')
  }
  await checkEnvironment(stackRunner(config, runner), (error) => console.error(error.message))
}

async function main() {
  const config = configuration(process.argv.slice(2))
  if (config.action === 'plan') {
    console.log(JSON.stringify(planMatrix(process.env.SAFE_E2E_SPECS, Number(process.env.SAFE_E2E_SHARDS || 1))))
    return
  }
  const runner = createProcessRunner()
  try {
    if (config.action === 'check') await runCheck(config, runner)
    else if (walletActions.includes(config.action)) await runWalletAction(config, runner)
    else await stackRunner(config, runner)(config.action)
  } finally {
    runner.dispose()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}

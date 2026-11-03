import { assertProjectName, localUrl } from './local-stack.mjs'

/** The local stack settings for specs and scenarios; outside the stack, the environment minus fork RPC URLs. */
export function isolatedEnvironment(env) {
  if (env.SAFE_E2E_ISOLATED !== 'true') {
    return Object.fromEntries(
      Object.entries(env).filter(([key]) => !key.startsWith('FORK_') && key !== 'SEPOLIA_FORK_RPC_URL'),
    )
  }
  const result = { SAFE_E2E_ISOLATED: true }
  result.SAFE_E2E_PROJECT = assertProjectName(env.SAFE_E2E_PROJECT || 'safe-e2e-local')
  for (const key of ['SAFE_CGW_BASE_URL', 'SAFE_TXS_BASE_URL', 'SAFE_RPC_URL']) {
    result[key] = localUrl(env[key], key)
  }
  result.SAFE_E2E_CHAINS = Object.fromEntries(
    Object.entries(JSON.parse(env.SAFE_E2E_CHAINS || '{}')).map(([chainId, chain]) => [
      chainId,
      {
        rpcUrl: localUrl(chain.rpcUrl, `Chain ${chainId} RPC`),
        transactionServiceUrl: localUrl(chain.transactionServiceUrl, `Chain ${chainId} Transaction Service`),
      },
    ]),
  )
  return result
}

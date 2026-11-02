import type { JsonRpcProvider } from 'ethers'
import { localProvider } from '../../environment/scenarios/provider.mjs'
import { onChain } from '../../environment/scenarios/safe.mjs'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

/** Runs `read` with a provider for the local fork, and closes the provider afterwards. */
export async function readChain<T>(
  env: JourneyEnvironment,
  read: (provider: JsonRpcProvider) => Promise<T>,
): Promise<T> {
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
    return await read(provider)
  } finally {
    provider.destroy()
  }
}

/** The environment of the fork of `chainId`, so that the chain readers read that fork instead of Sepolia */
export function forkEnvironment(env: JourneyEnvironment, chainId: number): JourneyEnvironment {
  return { ...env, SAFE_RPC_URL: onChain(env, chainId).SAFE_RPC_URL }
}

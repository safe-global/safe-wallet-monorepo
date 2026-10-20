import { localProvider } from '../../environment/scenarios/provider.mjs'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

/** The ETH balance of `address` on the local fork, in wei. */
export async function balanceOf(env: JourneyEnvironment, address: string): Promise<bigint> {
  const provider = localProvider(env.SAFE_RPC_URL)
  try {
    return await provider.getBalance(address)
  } finally {
    provider.destroy()
  }
}

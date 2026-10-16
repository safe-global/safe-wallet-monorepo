import { readChain } from './local-provider'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

/** The ETH balance of `address` on the local fork, in wei. */
export function balanceOf(env: JourneyEnvironment, address: string): Promise<bigint> {
  return readChain(env, (provider) => provider.getBalance(address))
}

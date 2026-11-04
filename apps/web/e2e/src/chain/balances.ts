import { Contract } from 'ethers'
import { erc20 } from '../../environment/scenarios/chain.mjs'
import { readChain } from './local-provider'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'

/** The ETH balance of `address` on the local fork, in wei. */
export function balanceOf(env: JourneyEnvironment, address: string): Promise<bigint> {
  return readChain(env, (provider) => provider.getBalance(address))
}

/** The `token` balance of `holder` on the local fork, in base units. */
export function tokenBalanceOf(
  env: JourneyEnvironment,
  { token, holder }: { token: string; holder: string },
): Promise<bigint> {
  return readChain(env, async (provider) => {
    const balance: unknown = await new Contract(token, erc20, provider).getFunction('balanceOf')(holder)
    if (typeof balance !== 'bigint') throw new Error(`balanceOf(${holder}) on ${token} did not return a uint256`)
    return balance
  })
}

import { Contract, ZeroAddress } from 'ethers'
import { ALLOWANCE_MODULE, allowanceModuleAbi } from '../../environment/scenarios/allowance.mjs'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'
import { readChain } from './local-provider'

export type TokenAllowance = { amount: bigint; spent: bigint }

/** The allowance of `token` (ETH by default) that the Safe gives `delegate`, as the AllowanceModule stores it, in base units. */
export function allowanceOf(
  env: JourneyEnvironment,
  { safe, delegate, token = ZeroAddress }: { safe: string; delegate: string; token?: string },
): Promise<TokenAllowance> {
  return readChain(env, async (provider) => {
    const allowanceModule = new Contract(ALLOWANCE_MODULE, allowanceModuleAbi, provider)
    const [amount, spent]: bigint[] = await allowanceModule.getFunction('getTokenAllowance')(safe, delegate, token)
    return { amount, spent }
  })
}

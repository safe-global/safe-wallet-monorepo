import { Contract, ZeroAddress } from 'ethers'
import { ALLOWANCE_MODULE, allowanceModuleAbi } from '../../environment/scenarios/allowance.mjs'
import type { JourneyEnvironment } from '../fixtures/journey.fixture'
import { readChain } from './local-provider'

export type TokenAllowance = { amount: bigint; spent: bigint }

/** The native-token allowance that the Safe gives `delegate`, as the AllowanceModule stores it, in wei. */
export function nativeAllowanceOf(
  env: JourneyEnvironment,
  { safe, delegate }: { safe: string; delegate: string },
): Promise<TokenAllowance> {
  return readChain(env, async (provider) => {
    const allowanceModule = new Contract(ALLOWANCE_MODULE, allowanceModuleAbi, provider)
    const [amount, spent]: bigint[] = await allowanceModule.getFunction('getTokenAllowance')(
      safe,
      delegate,
      ZeroAddress,
    )
    return { amount, spent }
  })
}

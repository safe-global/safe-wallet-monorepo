import type { BaseWallet } from 'ethers'
import { addDelegates } from '../../environment/scenarios/proposers.mjs'
import type { SeededSafe } from './safe'

/** Adds `delegate` as the only proposer of the Safe, signed by the owner `delegator`, and waits until CGW lists it. */
export async function seedProposer(
  safe: SeededSafe,
  { delegate, delegator }: { delegate: Pick<BaseWallet, 'address'>; delegator: BaseWallet },
): Promise<void> {
  const { env } = safe.context
  await addDelegates(env, safe.context, [{ delegate: delegate.address, delegator, label: 'Proposer' }])
}

import type { BaseWallet } from 'ethers'
import { waitForNextSecond } from '../../environment/scenarios/chain.mjs'
import { enableRecovery } from '../../environment/scenarios/recovery.mjs'
import { readChain } from '../chain/local-provider'
import { delayModifierAt } from '../chain/recovery'
import type { SeededSafe } from './safe'

export const DAY_IN_SECONDS = 24 * 60 * 60

export type SeededRecovery = {
  safe: SeededSafe
  delayModifier: string
  cooldownSeconds: number
}

/** Swaps one owner of the Safe for a new one, the proposal that a recoverer sends */
export type OwnerSwap = { oldOwner: string; newOwner: string }

/** Enables a Delay modifier on the Safe with `recoverer` and no expiry, signed by the Safe's OWNER_4. */
export async function seedRecovery(
  safe: SeededSafe,
  { recoverer, cooldownSeconds }: { recoverer: string; cooldownSeconds: number },
): Promise<SeededRecovery> {
  const delayModifier = await readChain(safe.context.env, (provider) =>
    enableRecovery(safe.context.env, { ...safe.context, provider }, recoverer, { cooldown: cooldownSeconds }),
  )
  return { safe, delayModifier, cooldownSeconds }
}

/** The recoverer queues `swap` in the Delay modifier; returns the block time at which it was queued, in seconds. */
export async function seedProposedRecovery(
  { safe, delayModifier }: SeededRecovery,
  { recoverer, swap }: { recoverer: BaseWallet; swap: OwnerSwap },
): Promise<number> {
  const proposal = await safe.context.safe.createSwapOwnerTx({
    oldOwnerAddress: swap.oldOwner,
    newOwnerAddress: swap.newOwner,
  })
  return readChain(safe.context.env, async (provider) => {
    const delay = delayModifierAt(delayModifier, recoverer.connect(provider))
    const nonce = await delay.queueNonce()
    const { to, value, data, operation } = proposal.data
    await (await delay.execTransactionFromModule(to, value, data, operation)).wait()
    return Number(await delay.txCreatedAt(nonce))
  })
}

/** Like seedProposedRecovery, and mines blocks until the cooldown of the recovery has passed on chain. */
export async function seedExecutableRecovery(
  recovery: SeededRecovery,
  proposal: { recoverer: BaseWallet; swap: OwnerSwap },
): Promise<void> {
  const queuedAt = await seedProposedRecovery(recovery, proposal)
  await readChain(recovery.safe.context.env, (provider) =>
    waitForNextSecond(provider, queuedAt + recovery.cooldownSeconds - 1),
  )
}

import { parseEther } from 'ethers'
import { waitForQueued } from '../../environment/scenarios/indexing.mjs'
import { createSafeAddress, openSafe, proposeTransaction } from '../../environment/scenarios/safe.mjs'
import { NETWORK_PREFIXES } from '../data/constants'
import type { Journey } from '../fixtures/journey.fixture'

export type SeededSafe = {
  address: string
  /** The `sep:0x…` form that wallet URLs take */
  prefixedAddress: string
  /** Signs and proposes as the journey's OWNER_4 */
  context: Awaited<ReturnType<typeof openSafe>>
}

export type QueuedTransaction = {
  safeTxHash: string
  /** The CGW transaction ID, as in `/transactions/tx?id=` */
  txId: string
}

/** Deploys a Safe of OWNER_4 and OWNER_1 (and OWNER_2 for 3 owners) with 1 ETH, and waits until CGW serves it. */
export async function seedSafe(
  journey: Journey,
  { threshold, ownerCount = 2 }: { threshold: 1 | 2; ownerCount?: 2 | 3 },
): Promise<SeededSafe> {
  const { env, owners } = journey
  const ownerAddresses = [owners.owner4, owners.owner1, owners.owner2]
    .slice(0, ownerCount)
    .map((owner) => owner.address)
  const address = await createSafeAddress(env, owners, { threshold, ownerAddresses })
  return {
    address,
    prefixedAddress: `${NETWORK_PREFIXES.sepolia}:${address}`,
    context: await openSafe(env, owners.owner4, address),
  }
}

/** Proposes an ETH transfer signed by OWNER_4, and waits until it is in the CGW queue. */
export async function seedQueuedTransfer(
  safe: SeededSafe,
  { nonce, recipient, amount }: { nonce: number; recipient: string; amount: string },
): Promise<QueuedTransaction> {
  const { context } = safe
  const transfer = await context.safe.createTransaction({
    transactions: [{ to: recipient, value: parseEther(amount).toString(), data: '0x' }],
    options: { nonce },
  })
  const { hash } = await proposeTransaction(context, transfer)
  await waitForQueued(context.env, context, [hash])
  return { safeTxHash: hash, txId: `multisig_${safe.address}_${hash}` }
}

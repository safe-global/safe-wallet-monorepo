import { parseEther } from 'ethers'
import { waitForQueued, waitUntil } from '../../environment/scenarios/indexing.mjs'
import { createSafeAddress, openSafe, proposeTransaction } from '../../environment/scenarios/safe.mjs'
import type { OwnedSafes } from '@safe-global/store/gateway/types'
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

/** Deploys a Safe of OWNER_4 (and OWNER_1, OWNER_2 for more owners) with 1 ETH, and waits until CGW serves it. */
export async function seedSafe(
  journey: Journey,
  { threshold, ownerCount = 2 }: { threshold: 1 | 2; ownerCount?: 1 | 2 | 3 },
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

type NestedSafeOptions = {
  /** The parent's owners: OWNER_4, and OWNER_1 for 2 */
  parent?: { ownerCount: 1 | 2; threshold: 1 | 2 }
  /** The child's owners: the parent, and OWNER_4 too with `withOwner4` */
  child?: { withOwner4: boolean; threshold: 1 | 2 }
}

/**
 * Deploys a parent Safe and a child Safe that the parent owns, by default both 1/1 with OWNER_4 as the parent's
 * owner. Waits until CGW lists the parent among OWNER_4's Safes, which makes OWNER_4 a nested owner of the child.
 */
export async function seedNestedSafe(
  journey: Journey,
  {
    parent: parentOptions = { ownerCount: 1, threshold: 1 },
    child: childOptions = { withOwner4: false, threshold: 1 },
  }: NestedSafeOptions = {},
): Promise<{ parent: SeededSafe; child: SeededSafe }> {
  const { env, owners } = journey
  const parent = await seedSafe(journey, parentOptions)
  const childOwners = childOptions.withOwner4 ? [owners.owner4.address, parent.address] : [parent.address]
  const address = await createSafeAddress(env, owners, {
    threshold: childOptions.threshold,
    ownerAddresses: childOwners,
  })
  const { env: scenarioEnv, chainId } = parent.context
  await waitUntil(
    scenarioEnv,
    `${scenarioEnv.SAFE_CGW_BASE_URL}/v1/chains/${chainId}/owners/${owners.owner4.address}/safes`,
    (result: OwnedSafes) => result.safes.includes(parent.address),
  )
  return {
    parent,
    child: {
      address,
      prefixedAddress: `${NETWORK_PREFIXES.sepolia}:${address}`,
      context: await openSafe(env, owners.owner4, address),
    },
  }
}

import { parseEther } from 'ethers'
import { waitForQueued, waitUntil } from '../../environment/scenarios/indexing.mjs'
import {
  createSafeAddress,
  executeTransaction,
  openSafe,
  proposeTransaction,
} from '../../environment/scenarios/safe.mjs'
import { readChain } from '../chain/local-provider'
import type { OwnedSafes } from '@safe-global/store/gateway/types'
import { NETWORK_PREFIXES } from '../data/constants'
import type { Journey, OwnerName } from '../fixtures/journey.fixture'

export type SeededSafe = {
  address: string
  /** The `sep:0x…` form that wallet URLs take */
  prefixedAddress: string
  /** Signs and proposes as the Safe's first owner that is a journey owner, or as OWNER_4 when it has none */
  context: Awaited<ReturnType<typeof openSafe>>
}

export type QueuedTransaction = {
  safeTxHash: string
  /** The CGW transaction ID, as in `/transactions/tx?id=` */
  txId: string
}

export type SafeSetup = {
  /** A journey owner, or a seeded Safe that owns this one */
  owners: Array<OwnerName | SeededSafe>
  threshold: number
  safeVersion?: '1.4.1' | '1.5.0'
}

/** Deploys a Safe with 1 ETH, waits until CGW serves it, and names it in the test report. */
export async function seedSafe(journey: Journey, { owners, threshold, safeVersion }: SafeSetup): Promise<SeededSafe> {
  const { env } = journey
  const ownerAddresses = owners.map((owner) =>
    typeof owner === 'string' ? journey.owners[owner].address : owner.address,
  )
  const address = await createSafeAddress(env, journey.owners, { threshold, ownerAddresses, safeVersion })
  const signer = owners.find((owner): owner is OwnerName => typeof owner === 'string') ?? 'owner4'
  const safe = {
    address,
    prefixedAddress: `${NETWORK_PREFIXES.sepolia}:${address}`,
    context: await openSafe(env, journey.owners[signer], address),
  }
  journey.recordSafe(safe)
  return safe
}

/** Proposes an ETH transfer signed by the Safe's context signer, and waits until it is in the CGW queue. */
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

/** Executes an ETH transfer signed by the Safe's context signer, and waits until the CGW history lists it. */
export async function seedExecutedTransfer(
  safe: SeededSafe,
  { recipient, amount }: { recipient: string; amount: string },
): Promise<void> {
  const { context } = safe
  const transfer = await context.safe.createTransaction({
    transactions: [{ to: recipient, value: parseEther(amount).toString(), data: '0x' }],
  })
  await readChain(context.env, (provider) => executeTransaction({ ...context, provider }, transfer))
}

type NestedSafeSetup = {
  parent: { owners: OwnerName[]; threshold: number }
  /** `'parent'` stands for the parent Safe */
  child: { owners: Array<OwnerName | 'parent'>; threshold: number; safeVersion?: '1.4.1' | '1.5.0' }
}

/**
 * Deploys a parent Safe and a child Safe that the parent owns. Waits until CGW lists the parent among OWNER_4's
 * Safes, which makes an OWNER_4 of the parent a nested owner of the child.
 */
export async function seedNestedSafe(
  journey: Journey,
  { parent: parentSetup, child: childSetup }: NestedSafeSetup,
): Promise<{ parent: SeededSafe; child: SeededSafe }> {
  const parent = await seedSafe(journey, parentSetup)
  const child = await seedSafe(journey, {
    ...childSetup,
    owners: childSetup.owners.map((owner) => (owner === 'parent' ? parent : owner)),
  })
  const { env, chainId } = parent.context
  await waitUntil(
    env,
    `${env.SAFE_CGW_BASE_URL}/v1/chains/${chainId}/owners/${journey.owners.owner4.address}/safes`,
    (result: OwnedSafes) => result.safes.includes(parent.address),
  )
  return { parent, child }
}

import { buildContractSignature, buildSignatureBytes } from '@safe-global/protocol-kit'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SigningMethod } from '@safe-global/types-kit'
import { parseEther } from 'ethers'
import { confirmInQueue } from '../../environment/scenarios/gateway.mjs'
import { waitUntil } from '../../environment/scenarios/indexing.mjs'
import { openSafe } from '../../environment/scenarios/safe.mjs'
import { confirmationsOf, transactionsIn } from '../api/transaction-items'
import type { Journey } from '../fixtures/journey.fixture'
import { seedQueuedTransfer, seedSafe, type QueuedTransaction, type SeededSafe } from './safe'

const hasConfirmations = (queue: QueuedItemPage, txId: string, count: number): boolean =>
  transactionsIn(queue).some((tx) => tx.id === txId && confirmationsOf(tx) === count)

/** Proposes an ETH transfer signed by OWNER_4 and OWNER_1, and waits until the CGW queue shows both signatures. */
export async function seedSignedTransfer(
  journey: Journey,
  safe: SeededSafe,
  transfer: { nonce: number; recipient: string; amount: string },
): Promise<QueuedTransaction> {
  const queued = await seedQueuedTransfer(safe, transfer)
  const { context } = safe
  const owner1 = await openSafe(journey.env, journey.owners.owner1, safe.address)
  const signature = await owner1.safe.signHash(queued.safeTxHash)
  await confirmInQueue(context, queued.safeTxHash, signature.data)
  await waitUntil(context.env, `${context.path}/transactions/queued`, (queue: QueuedItemPage) =>
    hasConfirmations(queue, queued.txId, 2),
  )
  return queued
}

/**
 * Deploys a 2/2 Safe of OWNER_4 and a parent Safe (1/1 of OWNER_1), and proposes an ETH transfer signed by OWNER_4.
 * The parent confirms it with an EIP-1271 contract signature, built by protocol-kit as a parent Safe owner would.
 * Waits until the CGW queue shows both signatures.
 */
export async function seedTransferWithContractSignature(
  journey: Journey,
  transfer: { recipient: string; amount: string },
): Promise<SeededSafe> {
  const parent = await seedSafe(journey, { owners: ['owner1'], threshold: 1 })
  const safe = await seedSafe(journey, { owners: ['owner4', parent], threshold: 2 })
  const queued = await seedQueuedTransfer(safe, { nonce: 0, ...transfer })

  const transaction = await safe.context.safe.createTransaction({
    transactions: [{ to: transfer.recipient, value: parseEther(transfer.amount).toString(), data: '0x' }],
    options: { nonce: 0 },
  })
  const signedByParentOwner = await parent.context.safe.signTransaction(
    transaction,
    SigningMethod.SAFE_SIGNATURE,
    safe.address,
  )
  const contractSignature = await buildContractSignature([...signedByParentOwner.signatures.values()], parent.address)
  await confirmInQueue(safe.context, queued.safeTxHash, buildSignatureBytes([contractSignature]))
  await waitUntil(journey.env, `${safe.context.path}/transactions/queued`, (queue: QueuedItemPage) =>
    hasConfirmations(queue, queued.txId, 2),
  )
  return safe
}

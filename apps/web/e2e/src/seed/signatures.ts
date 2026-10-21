import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { confirmInQueue } from '../../environment/scenarios/gateway.mjs'
import { waitUntil } from '../../environment/scenarios/indexing.mjs'
import { openSafe } from '../../environment/scenarios/safe.mjs'
import { transactionsIn } from '../api/transaction-items'
import type { Journey } from '../fixtures/journey.fixture'
import { seedQueuedTransfer, type QueuedTransaction, type SeededSafe } from './safe'

function confirmationsOf(queue: QueuedItemPage, txId: string): number | undefined {
  const transaction = transactionsIn(queue).find((tx) => tx.id === txId)
  return transaction?.executionInfo?.type === 'MULTISIG' ? transaction.executionInfo.confirmationsSubmitted : undefined
}

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
  await waitUntil(
    context.env,
    `${context.path}/transactions/queued`,
    (queue: QueuedItemPage) => confirmationsOf(queue, queued.txId) === 2,
  )
  return queued
}

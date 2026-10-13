import { accounts, getAccount, getScenario, getState } from './model'
import type { Account, Persona, Proposal, Scenario } from '../types'

export type PreviewQueue = {
  items: Proposal[]
  completed: Proposal[]
  nextNonces: Record<string, number>
  nextProposalId: number
}
export type PreviewAction = 'sign' | 'execute' | 'signAndExecute'

export const createPreviewQueue = (scenario: Scenario): PreviewQueue => ({
  items: getScenario(scenario),
  completed: [],
  nextProposalId: 1,
  nextNonces: Object.fromEntries(accounts.map((account) => [account.id, account.nextNonce])),
})

export function applyPreviewAction(
  queue: PreviewQueue,
  id: string,
  persona: Persona,
  action: PreviewAction,
): PreviewQueue {
  const proposal = queue.items.find((item) => item.id === id)
  if (!proposal) return queue
  const state = getState(proposal, persona)
  if (action === 'sign' && !state.canSign) return queue
  if (action === 'execute' && !state.ready) return queue
  if (action === 'signAndExecute' && !state.finalSignature) return queue
  const signed = action === 'execute' ? proposal : { ...proposal, signers: [...proposal.signers, 'Dev'] }
  if (action === 'sign') {
    return { ...queue, items: queue.items.map((item) => (item.id === id ? signed : item)) }
  }
  const nextNonce = proposal.nonce + 1
  return {
    ...queue,
    items: queue.items
      .filter((item) => item.account !== proposal.account || item.nonce !== proposal.nonce)
      .map((item) => (item.account === proposal.account ? { ...item, queueNextNonce: nextNonce } : item)),
    completed: [...queue.completed, signed],
    nextNonces: { ...queue.nextNonces, [proposal.account]: nextNonce },
  }
}

export function proposePreviewAlternative(
  queue: PreviewQueue,
  id: string,
  persona: Persona,
  kind: 'cancellation' | 'replacement',
  replacement?: { recipient: string; amount: string },
): { queue: PreviewQueue; proposal?: Proposal } {
  const original = queue.items.find((item) => item.id === id)
  if (!original || persona !== 'owner' || !getAccount(original).owners.includes('Dev')) return { queue }
  if (kind === 'replacement' && (!replacement?.recipient.trim() || !replacement.amount.trim())) return { queue }
  const proposal: Proposal = {
    id: `${original.account}-${original.nonce}-${kind}-${queue.nextProposalId}`,
    account: original.account,
    nonce: original.nonce,
    queueNextNonce: queue.nextNonces[original.account],
    kind,
    recipient: kind === 'cancellation' ? 'This Safe account' : replacement!.recipient.trim(),
    amount: kind === 'cancellation' ? '0 ETH' : replacement!.amount.trim(),
    age: 'Just now',
    signers: ['Dev'],
    eligible: true,
  }
  return { queue: { ...queue, items: [...queue.items, proposal], nextProposalId: queue.nextProposalId + 1 }, proposal }
}

export const BULK_EXECUTE_LIMIT = 20
export type BulkBatch = { account: Account; proposals: Proposal[]; blocked?: { nonce: number; competing: number } }

// Mirrors the single-Safe rules: fully signed, consecutive from the next nonce, one per nonce, at most 20.
export function getBulkExecutable(items: Proposal[]): BulkBatch[] {
  return accounts.flatMap((base) => {
    const safeItems = items.filter((tx) => tx.account === base.id)
    if (!safeItems.length) return []
    const account = getAccount(safeItems[0])
    const proposals: Proposal[] = []
    let blocked: BulkBatch['blocked']
    for (let nonce = account.nextNonce; proposals.length < BULK_EXECUTE_LIMIT; nonce++) {
      const atNonce = safeItems.filter((tx) => tx.nonce === nonce)
      if (!atNonce.some((tx) => getState(tx).missing === 0)) break
      if (atNonce.length > 1) {
        blocked = { nonce, competing: atNonce.length }
        break
      }
      proposals.push(atNonce[0])
    }
    return proposals.length || blocked ? [{ account, proposals, blocked }] : []
  })
}

export function executePreviewBatches(queue: PreviewQueue, batches: BulkBatch[]): PreviewQueue {
  return batches
    .flatMap((batch) => batch.proposals)
    .reduce((current, proposal) => applyPreviewAction(current, proposal.id, 'owner', 'execute'), queue)
}

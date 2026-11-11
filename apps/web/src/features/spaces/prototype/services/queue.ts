import { getAccount, getScenario, getScenarioAccounts, getState, knownAccounts } from './model'
import type { Account, Persona, Proposal, QueueState, Scenario } from '../types'
import { getYou, isSignerOf, isYou } from './personas'

export type PreviewQueue = {
  items: Proposal[]
  completed: Proposal[]
  nextNonces: Record<string, number>
  nextProposalId: number
}
export type PreviewAction = 'sign' | 'execute' | 'signAndExecute'

// The first fully signed transaction, which the Executing state starts with.
export const getFirstReady = (items: Proposal[]) => items.find((tx) => getState(tx).ready)

// Partial loading: the last Safes in the workspace fail to load, never all of them.
// `?failed=all`: nothing loads, so the page explains why instead of showing an empty queue.
export const ALL_FAILED = 99
export const getFailedAccounts = (scenario: Scenario, count = 1): Account[] => {
  const all = getScenarioAccounts(scenario)
  if (count >= ALL_FAILED) return all
  const failing = Math.min(Math.max(count, 1), all.length - 1)
  return failing > 0 ? all.slice(all.length - failing) : []
}

// Safes that aren't deployed yet have no queue, so they're never an error. They sit just before the failed ones.
export const getUndeployedAccounts = (scenario: Scenario, failedCount = 1, count = 0): Account[] => {
  const all = getScenarioAccounts(scenario)
  const end = all.length - getFailedAccounts(scenario, failedCount).length
  return count > 0 ? all.slice(Math.max(0, end - count), end) : []
}

// States layer on any scenario. Partial loading drops the failed Safes. Executing gives the running
// transaction a rejection at its nonce, so the lock shows.
export const applyQueueState = (
  items: Proposal[],
  scenario: Scenario,
  state: QueueState,
  failedCount = 1,
  undeployedCount = 0,
): Proposal[] => {
  if (state === 'empty' || state === 'loading' || state === 'error') return []
  if (state === 'partial') {
    const missing = [
      ...getFailedAccounts(scenario, failedCount),
      ...getUndeployedAccounts(scenario, failedCount, undeployedCount),
    ].map((account) => account.id)
    return items.filter((tx) => !missing.includes(tx.account))
  }
  const running = state === 'executing' ? getFirstReady(items) : undefined
  if (
    !running ||
    items.some((tx) => tx.id !== running.id && tx.account === running.account && tx.nonce === running.nonce)
  )
    return items
  return [
    ...items,
    {
      id: `${running.id}-reject`,
      account: running.account,
      nonce: running.nonce,
      recipient: getAccount(running).name,
      amount: '',
      kind: { type: 'rejection' },
      age: '3m ago',
      signers: [getAccount(running).owners.at(-1)!],
      eligible: true,
    },
  ]
}

// Over 500 transactions: the gateway returns the first 500 in nonce order and the size of the whole queue.
export const CAPPED_EXTRA = 120

// New proposal arrives: what production's 15-second refresh brings in. Someone else proposed it, and it needs you.
export const getIncomingProposal = (items: Proposal[], persona: Persona): Proposal | undefined => {
  const base = knownAccounts.find(
    (account) => account.threshold > 1 && isSignerOf(account, persona) && items.some((tx) => tx.account === account.id),
  )
  if (!base) return undefined
  const safeItems = items.filter((tx) => tx.account === base.id)
  const { nextNonce } = getAccount(safeItems[0])
  return {
    id: `${base.id}-incoming`,
    account: base.id,
    nonce: Math.max(nextNonce - 1, ...safeItems.map((tx) => tx.nonce)) + 1,
    recipient: 'Northwind · 0x2b9c…71e0',
    amount: '12,500 USDC',
    kind: { type: 'transfer' },
    age: 'Just now',
    signers: [base.owners.find((owner) => !isYou(owner, persona)) ?? base.owners[0]],
    eligible: true,
  }
}

export const createPreviewQueue = (
  scenario: Scenario,
  state: QueueState = 'normal',
  options: { deepQueue?: boolean; failedCount?: number; undeployedCount?: number } = {},
): PreviewQueue => ({
  items: applyQueueState(getScenario(scenario, options), scenario, state, options.failedCount, options.undeployedCount),
  completed: [],
  nextProposalId: 1,
  nextNonces: Object.fromEntries(getScenarioAccounts(scenario).map((account) => [account.id, account.nextNonce])),
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
  const signed = action === 'execute' ? proposal : { ...proposal, signers: [...proposal.signers, getYou(persona)!] }
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
  const you = getYou(persona)
  if (!original || !you || !isSignerOf(getAccount(original), persona)) return { queue }
  if (kind === 'replacement' && (!replacement?.recipient.trim() || !replacement.amount.trim())) return { queue }
  const proposal: Proposal = {
    id: `${original.account}-${original.nonce}-${kind}-${queue.nextProposalId}`,
    account: original.account,
    nonce: original.nonce,
    queueNextNonce: queue.nextNonces[original.account],
    kind: kind === 'cancellation' ? { type: 'rejection' } : { type: 'transfer' },
    ...(kind === 'replacement' && { origin: 'replacement' as const }),
    recipient: kind === 'cancellation' ? 'This Safe account' : replacement!.recipient.trim(),
    amount: kind === 'cancellation' ? '0 ETH' : replacement!.amount.trim(),
    age: 'Just now',
    signers: [you],
    eligible: true,
  }
  return { queue: { ...queue, items: [...queue.items, proposal], nextProposalId: queue.nextProposalId + 1 }, proposal }
}

export const BULK_EXECUTE_LIMIT = 20
export type BulkBatch = { account: Account; proposals: Proposal[]; blocked?: { nonce: number; competing: number } }

// Mirrors the single-Safe rules: fully signed, consecutive from the next nonce, one per nonce, at most 20.
export function getBulkExecutable(items: Proposal[]): BulkBatch[] {
  return knownAccounts.flatMap((base) => {
    const safeItems = items.filter((tx) => tx.account === base.id)
    if (!safeItems.length) return []
    const account = getAccount(safeItems[0])
    const proposals: Proposal[] = []
    let blocked: BulkBatch['blocked']
    for (let nonce = account.nextNonce; proposals.length < BULK_EXECUTE_LIMIT; nonce++) {
      const atNonce = safeItems.filter((tx) => tx.nonce === nonce)
      if (!atNonce.some((tx) => getState(tx).missing === 0 && !getState(tx).expired)) break
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

import type { BatchAction, Proposal } from '../types'
import {
  getAccount,
  getRecipientAddress,
  getRecipientName,
  getSignerIdentity,
  getTransactionLabel,
  shortAddress,
  type TypeLabel,
} from './model'

// Transaction and With columns: what a proposal does, and what it changes.

export const getHeadline = (tx: Proposal) => {
  const { kind } = tx
  switch (kind.type) {
    case 'transfer':
      return `Send ${tx.amount}`
    case 'swap':
      return `Swap ${kind.sell} → ${kind.buy}`
    case 'bridge':
      return `Bridge ${kind.sell}`
    case 'batch':
      return `Batch · ${kind.actions.length} actions`
    case 'contract':
      return `Call ${kind.method}`
    case 'nested':
      return `Approve #${kind.parentNonce}`
    case 'rejection':
      return `Reject #${tx.nonce}`
    case 'settings':
      return getTransactionLabel(tx)
  }
}

// Next to the type tag: what happens, without repeating the type or naming the other party.
export const getSummary = (tx: Proposal) => {
  const { kind } = tx
  switch (kind.type) {
    case 'transfer':
      return tx.amount
    case 'swap':
      return `${kind.sell} → ${kind.buy}`
    case 'bridge':
      return kind.sell
    case 'batch':
      return `${kind.actions.length} actions`
    case 'contract':
      return kind.method
    case 'nested':
      return `Approves #${kind.parentNonce}`
    case 'rejection':
      return `Cancels #${tx.nonce}`
    case 'settings':
      return getTransactionLabel(tx)
  }
}

// The summary's tooltip: the value in dollars, or what the action does.
export const getSummaryHint = (tx: Proposal) => {
  const { kind } = tx
  const { threshold, owners } = getAccount(tx)
  switch (kind.type) {
    case 'transfer':
      return tx.fiat ? `Worth about ${tx.fiat}` : undefined
    case 'swap':
      return `${kind.order === 'market' ? 'Market' : kind.order === 'limit' ? 'Limit' : 'TWAP'} order · ${kind.expiry}`
    case 'bridge':
      return `${kind.destination ? `To ${kind.destination}` : 'To an unknown network'} · Fees ${kind.fees}`
    case 'batch':
      return [`${kind.actions.length} actions in one transaction`, tx.amount, tx.fiat].filter(Boolean).join(' · ')
    case 'contract':
      return [kind.verified ? 'Verified contract' : 'Unverified contract', ...(kind.steps ?? []), tx.amount]
        .filter(Boolean)
        .join(' · ')
    case 'nested':
      return `Signs #${kind.parentNonce} on ${kind.parentSafe}, a Safe this one is a signer of`
    case 'rejection':
      return `An empty transaction at #${tx.nonce}. Executing it cancels everything else at this nonce.`
    case 'settings':
      switch (kind.change.kind) {
        case 'addOwner':
          return `Threshold stays ${threshold} of ${owners.length + 1}`
        case 'removeOwner':
          return `Threshold ${threshold} of ${owners.length - 1}`
        case 'changeThreshold':
          return `${threshold} → ${kind.change.threshold} of ${owners.length}`
        default:
          return 'Changes who controls funds'
      }
  }
}

// Between the summary and the other party, so the line reads as a sentence.
export const getCounterpartyJoin = (tx: Proposal) =>
  tx.kind.type === 'transfer' ? 'to' : tx.kind.type === 'bridge' || tx.kind.type === 'batch' ? 'via' : 'on'

export type Counterparty = {
  name: string
  // Sets the identicon. Fixtures have only short addresses.
  avatar: string
  detail?: string
  // Shown in the avatar tooltip, as in the Safe column.
  address?: string
  tone?: 'warning' | 'success'
  // Contracts: the logo when known, otherwise the code icon instead of an identicon.
  logo?: string
  contract?: boolean
}

const MULTISEND = { name: 'MultiSendCallOnly 1.4.1', address: '0x40a2…3a1e' }

export const getCounterpartyCell = (tx: Proposal): Counterparty => {
  const { kind } = tx
  const account = getAccount(tx)
  const self = { name: 'This Safe', avatar: account.iconAddress, detail: account.address, address: account.iconAddress }
  const recipientAddress = getRecipientAddress(tx)
  const named = (name: string, detail = getRecipientAddress(tx)) => ({
    name,
    avatar: getSignerIdentity(name).address,
    detail,
    address: recipientAddress?.startsWith('0x') ? recipientAddress : undefined,
  })
  switch (kind.type) {
    case 'settings':
    case 'rejection':
      return self
    case 'transfer':
      return kind.toSelf ? self : named(getRecipientName(tx))
    case 'swap':
      return named(getRecipientName(tx), 'Swap protocol')
    case 'bridge':
      return kind.destination
        ? named(getRecipientName(tx), `To ${kind.destination}`)
        : { ...named(getRecipientName(tx), 'To an unknown network'), tone: 'warning' }
    case 'contract':
      return {
        ...named(kind.contract, kind.verified ? 'Verified contract' : 'Unverified contract'),
        tone: kind.verified ? 'success' : 'warning',
        logo: kind.logo,
        contract: true,
      }
    case 'batch': {
      const contract = recipientAddress?.startsWith('0x')
        ? named(getRecipientName(tx))
        : {
            name: MULTISEND.name,
            avatar: MULTISEND.address,
            detail: shortAddress(MULTISEND.address),
            address: MULTISEND.address,
          }
      return kind.delegateCall
        ? { ...contract, detail: 'Delegate call', tone: kind.delegateCall === 'untrusted' ? 'warning' : undefined }
        : contract
    }
    case 'nested':
      return named(kind.parentSafe, 'Parent Safe')
  }
}

export const TYPE_HINTS: Record<TypeLabel, string> = {
  Send: 'Transfers tokens out of this Safe.',
  Swap: 'Trades one token for another through a swap protocol.',
  Bridge: 'Moves tokens from this network to another one.',
  Batch: 'Runs several actions together in one transaction.',
  Contract: 'Calls a function on a smart contract.',
  Settings: 'Changes this Safe’s settings, such as its signers or threshold.',
  Nested: 'Approves a transaction on another Safe that this Safe co-owns.',
  'On-chain rejection': 'Cancels the proposal at this nonce by replacing it.',
}

// Fixtures name every recipient, so this lists the ones treated as not in the address book.
const NEW_RECIPIENTS = ['Exchange deposit', 'Whitehat']
export const isNewRecipient = (tx: Proposal) =>
  tx.kind.type === 'transfer' && !tx.kind.toSelf && NEW_RECIPIENTS.includes(getRecipientName(tx))

const METHOD_NOUNS: Record<string, [string, string]> = {
  transfer: ['transfer', 'transfers'],
  approve: ['approval', 'approvals'],
}

// "12 transfers · 2 approvals"
export const getActionBreakdown = (actions: BatchAction[]) => {
  const counts = new Map<string, number>()
  actions.forEach(({ method }) => counts.set(method, (counts.get(method) ?? 0) + 1))
  return [...counts]
    .map(([method, count]) => {
      const noun = METHOD_NOUNS[method]
      return noun ? `${count} ${noun[count === 1 ? 0 : 1]}` : `${count} ${method}`
    })
    .join(' · ')
}

import type { Proposal } from '../types'
import { getAccount, getSignerIdentity } from './model'

// Placeholder values for the production Receipt fields. Stable for each transaction. Not signable.
const hex = (seed: string, length: number) => {
  let state = [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261)
  return Array.from({ length }, () => {
    state = (state * 1103515245 + 12345) >>> 0
    return (state >>> 16).toString(16).slice(-1)
  }).join('')
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const getTechnicalData = (tx: Proposal) => {
  const account = getAccount(tx)
  const delegateCall = tx.kind.type === 'batch' && !!tx.kind.delegateCall
  const signers = tx.signers.filter((owner) => account.owners.includes(owner))
  return {
    to:
      tx.kind.type === 'rejection' || tx.kind.type === 'settings' ? account.iconAddress : `0x${hex(`${tx.id}:to`, 40)}`,
    value: tx.kind.type === 'transfer' && tx.amount.endsWith('ETH') ? tx.amount : '0',
    data: tx.kind.type === 'transfer' && tx.amount.endsWith('ETH') ? '0x' : `0x${hex(`${tx.id}:data`, 136)}`,
    operation: delegateCall ? '1 (delegate call)' : '0 (call)',
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    refundReceiver: ZERO_ADDRESS,
    nonce: tx.nonce,
    signatures: signers.map((owner) => ({
      signer: getSignerIdentity(owner).address,
      bytes: `0x${hex(`${tx.id}:${owner}:sig`, 130)}`,
    })),
    domainHash: `0x${hex(`${account.id}:domain`, 64)}`,
    messageHash: `0x${hex(`${tx.id}:message`, 64)}`,
    safeTxHash: `0x${hex(`${tx.id}:safeTxHash`, 64)}`,
  }
}

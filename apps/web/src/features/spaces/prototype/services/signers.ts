import type { Persona, Proposal } from '../types'
import { getAccount, getSignedAt, getSignerIdentity, shortAddress } from './model'

export type SignerRow = {
  id: string
  name: string | null
  address: string
  // "You", the address-book name, or the short address when there is no name.
  label: string
  signed: boolean
  signedAt?: number
}

// One list for the tooltip and the drawer: signers in order, then signers who did not sign.
export const getSignerRows = (tx: Proposal, persona: Persona): SignerRow[] => {
  const { owners } = getAccount(tx)
  const signed = tx.signers.filter((owner) => owners.includes(owner))
  const outstanding = owners.filter((owner) => !tx.signers.includes(owner))
  const row = (id: string, index?: number): SignerRow => {
    const { name, address } = getSignerIdentity(id)
    return {
      id,
      name,
      address,
      label: id === 'Dev' && persona === 'owner' ? 'You' : (name ?? shortAddress(address)),
      signed: index !== undefined,
      signedAt: index !== undefined ? getSignedAt(tx, index) : undefined,
    }
  }
  return [...signed.map((id, index) => row(id, index)), ...outstanding.map((id) => row(id))]
}

export const getSignatureSummary = (tx: Proposal) => {
  const { threshold, owners } = getAccount(tx)
  const signed = tx.signers.filter((owner) => owners.includes(owner)).length
  const missing = Math.max(0, threshold - signed)
  return `${signed} of ${threshold} signed · ${missing ? `${missing} more needed` : 'threshold met'}`
}

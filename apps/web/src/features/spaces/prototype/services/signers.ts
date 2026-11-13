import { formatDateTime } from '@safe-global/utils/utils/date'
import type { Persona, Proposal } from '../types'
import type { SignatureRow } from '../components/Panel/SignaturesFooter'
import { getAccount, getCreatedAt, getCreator, getSignedAt, getSignerIdentity, shortAddress } from './model'
import { isSignerOf, isYou } from './personas'

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
      label: isYou(id, persona) ? 'You' : (name ?? shortAddress(address)),
      signed: index !== undefined,
      signedAt: index !== undefined ? getSignedAt(tx, index) : undefined,
    }
  }
  return [...signed.map((id, index) => row(id, index)), ...outstanding.map((id) => row(id))]
}

// Same numbers as the gauge: signed of required, then who can still sign.
export const getSignatureSummary = (tx: Proposal) => {
  const { threshold, owners } = getAccount(tx)
  const signed = tx.signers.filter((owner) => owners.includes(owner)).length
  const missing = Math.max(0, threshold - signed)
  const left = owners.length - signed
  return `${signed} of ${threshold} signed · ${missing ? `${missing} more from ${left} ${left === 1 ? 'signer' : 'signers'}` : 'threshold met'}`
}

// Explains a Waiting row when you cannot sign it.
export const getNotSignerNote = (tx: Proposal, persona: Persona) => {
  const account = getAccount(tx)
  return isSignerOf(account, persona) ? undefined : `You aren't a signer of ${account.name}.`
}

// Rows for the shared SignaturesFooter: created, signed in order, then still needed.
export const toSignatureRows = (tx: Proposal, persona: Persona): SignatureRow[] => [
  { kind: 'created', name: getCreator(tx) ?? 'Unknown', time: formatDateTime(getCreatedAt(tx)) },
  ...getSignerRows(tx, persona).map((row): SignatureRow => {
    const name = row.name ?? shortAddress(row.address)
    const you = isYou(row.id, persona)
    return row.signed
      ? { kind: 'signed', name, address: row.address, time: formatDateTime(row.signedAt ?? 0), you }
      : { kind: 'needed', name, address: row.address, you }
  }),
]

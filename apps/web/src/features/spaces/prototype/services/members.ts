import type { Account, Persona, Proposal } from '../types'
import {
  getAccount,
  getCreatedAt,
  getOutstandingSigners,
  getSignerIdentity,
  getSignerName,
  getState,
  isWorkspaceMember,
} from './model'
import { getYou, PERSONAS } from './personas'
import { getAttestation, getRegistry, getWallet, type Attestation, type WalletType } from './registry'

// Fleet admin: one team member, signer or not. Personas add a role; other signers fall back to "Signer".
export type MemberProfile = {
  id: string
  name: string
  address: string
  role: string
  access: 'Admin' | 'Member' | 'Not in workspace'
  you: boolean
  safes: Account[]
  waiting: Proposal[]
  signed: Proposal[]
  wallet: WalletType
  attestations: { account: Account; status: Attestation }[]
  contactFor: string[]
  lastSigned?: string
  issues: string[]
}

export const getMemberProfile = (
  id: string,
  accounts: Account[],
  items: Proposal[],
  persona: Persona,
): MemberProfile => {
  const profile = Object.values(PERSONAS).find((candidate) => candidate.you === id)
  const pending = items.filter((tx) => getState(tx, persona).missing > 0)
  const safes = accounts.filter((account) => account.owners.includes(id))
  const wallet = getWallet(id)
  const attestations = safes.map((account) => ({ account, status: getAttestation(account, id) }))
  const unattested = attestations.filter(({ status }) => status !== 'attested')
  const lastSigned = items.filter((tx) => tx.signers.includes(id)).sort((a, b) => getCreatedAt(b) - getCreatedAt(a))[0]
  return {
    id,
    name: getSignerName(id),
    address: getSignerIdentity(id).address,
    role: profile?.role ?? 'Signer',
    access: !isWorkspaceMember(id) ? 'Not in workspace' : profile?.admin ? 'Admin' : 'Member',
    you: getYou(persona) === id,
    safes,
    waiting: pending.filter((tx) => getOutstandingSigners(tx).includes(id)),
    signed: pending.filter((tx) => tx.signers.includes(id) && getAccount(tx).owners.includes(id)),
    wallet,
    attestations,
    contactFor: [
      ...new Set(accounts.filter((account) => getRegistry(account).contact === id).map((a) => getRegistry(a).group)),
    ],
    lastSigned: lastSigned?.age,
    issues: [
      ...(unattested.length ? [`No attestation on ${unattested.map(({ account }) => account.name).join(', ')}.`] : []),
    ],
  }
}

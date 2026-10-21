import type { Account, Persona, Proposal } from '../types'
import {
  getAccount,
  getOutstandingSigners,
  getSignerIdentity,
  getSignerName,
  getState,
  isWorkspaceMember,
} from './model'
import { getYou, PERSONAS } from './personas'

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
}

export const getMemberProfile = (
  id: string,
  accounts: Account[],
  items: Proposal[],
  persona: Persona,
): MemberProfile => {
  const profile = Object.values(PERSONAS).find((candidate) => candidate.you === id)
  const pending = items.filter((tx) => getState(tx, persona).missing > 0)
  return {
    id,
    name: getSignerName(id),
    address: getSignerIdentity(id).address,
    role: profile?.role ?? 'Signer',
    access: !isWorkspaceMember(id) ? 'Not in workspace' : profile?.admin ? 'Admin' : 'Member',
    you: getYou(persona) === id,
    safes: accounts.filter((account) => account.owners.includes(id)),
    waiting: pending.filter((tx) => getOutstandingSigners(tx).includes(id)),
    signed: pending.filter((tx) => tx.signers.includes(id) && getAccount(tx).owners.includes(id)),
  }
}

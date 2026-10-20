import type { Account, Persona } from '../types'

// "Preview as": who is signed in. `you` is the fixture signer id, absent for members who don't sign.
// Roles follow the Safe Labs persona families. Workflows name the Safe Pro features each one relies on.
export type PersonaProfile = {
  name: string
  role: string
  admin: boolean
  workflow: string
  // Sample jobs and pains from Safe persona research.
  jobs: string[]
  pains: string[]
  you?: string
  // Members who don't sign still sign in with a wallet.
  address?: string
}
export const PERSONAS: Record<Persona, PersonaProfile> = {
  owner: {
    name: 'Dev',
    role: 'Head of Treasury',
    admin: true,
    you: 'Dev',
    workflow: 'Proposes, signs and executes payments, with Copilot checks',
    jobs: [
      'Approve and pay contributors, vendors and investments',
      'Track treasury health across Safes and networks',
      'Execute fully signed transactions in nonce order',
    ],
    pains: [
      'Treasury data is fragmented across Safes and networks',
      'Waits on co-signers before the queue can move',
      'Gas often comes from a personal wallet',
    ],
  },
  single: {
    name: 'Sam',
    role: 'Payroll ops',
    admin: false,
    you: 'Sam',
    workflow: 'Signs the monthly payroll batch, recipients from the shared address book',
    jobs: [
      'Sign the payroll batch before the pay date',
      'Check recipients against the shared address book',
      'Flag errors before anyone executes',
    ],
    pains: [
      'Hard to find which Safe needs their signature',
      "Doesn't know when it's their turn to sign",
      'Hardware wallet signing is inconsistent',
    ],
  },
  member: {
    name: 'Alex',
    role: 'Finance controller',
    admin: false,
    address: '0xa1e70000000000000000000000000000000012ab',
    workflow: 'Tracks the queue, reminds signers, reconciles with the Activity log',
    jobs: [
      'Know what is pending and why it is stuck',
      'Chase signers before payment deadlines',
      'Reconcile executed transactions for month-end and audits',
    ],
    pains: [
      "Sees stuck transactions but can't sign them",
      'Still exports to spreadsheets to reconcile',
      'Missing labels make transactions hard to trace',
    ],
  },
  admin: {
    name: 'Noor',
    role: 'COO',
    admin: true,
    address: '0x400400000000000000000000000000000000e60d',
    workflow: 'Owns the Safe Pro plan and billing, invites signers, sets Policies',
    jobs: [
      'Choose and pay for the Safe Pro plan',
      'Invite members and signers to the workspace',
      'Set Policies and 2FA so every Safe follows the same rules',
    ],
    pains: [
      "Signers outside the workspace can't be reminded",
      'Security controls drift between Safes',
      'No single view of who can do what',
    ],
  },
}
export const getPersonaLabel = (persona: Persona) => `${PERSONAS[persona].name} · ${PERSONAS[persona].role}`

// `observer` was the old name for the member persona, kept so shared links still open.
export const parsePersona = (value: unknown): Persona =>
  value === 'observer' ? 'member' : typeof value === 'string' && value in PERSONAS ? (value as Persona) : 'owner'

export const getYou = (persona: Persona) => PERSONAS[persona].you
export const isYou = (id: string, persona: Persona) => id === getYou(persona)
export const isSignerOf = (account: Pick<Account, 'owners'>, persona: Persona) => {
  const you = getYou(persona)
  return !!you && account.owners.includes(you)
}
export const canInvite = (persona: Persona) => PERSONAS[persona].admin

import type { Account, Persona } from '../types'

// "Preview as": who is signed in. `you` is the fixture signer id, absent for members who don't sign.
// Roles follow the Safe Labs persona families. Jobs name the Safe Pro features each one relies on.
export type PersonaFamily = 'operator' | 'risk' | 'buyer'
export const FAMILY_LABELS: Record<PersonaFamily, string> = {
  operator: 'Daily operator',
  risk: 'Risk & security',
  buyer: 'Economic buyer',
}
export type PersonaProfile = {
  name: string
  role: string
  family: PersonaFamily
  // Primary: the daily operator who lives in Safe Pro and the buyer who pays for it.
  priority: 'primary' | 'secondary'
  admin: boolean
  // One job statement: "When …, I want to …, so I can …"
  jtbd: string
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
    role: 'Treasury manager',
    family: 'operator',
    priority: 'primary',
    admin: true,
    you: 'Dev',
    jtbd: 'When payments are due, I want to propose them and get them signed in nonce order, so I can pay on time without blocking other Safes.',
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
    role: 'Payroll signer',
    family: 'operator',
    priority: 'secondary',
    admin: false,
    you: 'Sam',
    jtbd: "When payroll is due, I want to know it's my turn and that the recipients are right, so I can sign with confidence.",
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
  security: {
    name: 'Jonas',
    role: 'Security lead',
    family: 'risk',
    priority: 'secondary',
    admin: false,
    you: 'Jonas',
    jtbd: "When a transaction touches a contract or changes signers, I want to verify the calldata and simulation myself, so I only sign what I've checked.",
    jobs: [
      'Verify transactions down to the calldata and hash',
      'Simulate with Copilot and Tenderly before signing',
      'Keep thresholds, guards and Policies consistent',
    ],
    pains: [
      "Won't sign from a browser wallet without a second check",
      'Batches and contract calls are hard to read',
      'Little support for automating routine checks',
    ],
  },
  member: {
    name: 'Alex',
    role: 'Finance controller',
    family: 'risk',
    priority: 'secondary',
    admin: false,
    address: '0xa1e70000000000000000000000000000000012ab',
    jtbd: "When a payment is stuck, I want to see who it's waiting on, so I can chase them before the deadline.",
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
    family: 'buyer',
    priority: 'primary',
    admin: true,
    address: '0x400400000000000000000000000000000000e60d',
    jtbd: "When the team grows, I want to keep every signer in the workspace under the same Policies, so controls don't drift between Safes.",
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

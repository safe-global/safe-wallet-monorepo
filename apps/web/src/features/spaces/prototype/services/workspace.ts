import type { Account, Persona, Scenario } from '../types'
import { getScenarioAccounts, getSignerIdentity, isWorkspaceMember } from './model'
import { getYou, isSignerOf, PERSONAS } from './personas'

// Safe Pro plans by Safe seats, from the feature gating spec. Members are unlimited and signers are never charged.
const PLANS: { name: string; seats: number }[] = [
  { name: 'Starter', seats: 2 },
  { name: 'Business', seats: 5 },
  { name: 'Business', seats: 10 },
  { name: 'Business', seats: 20 },
]

export const getPlan = (safes: number) => {
  const plan = PLANS.find(({ seats }) => safes <= seats)
  return plan
    ? { label: `Safe Pro ${plan.name} (${plan.seats} Safes)`, seats: plan.seats }
    : { label: 'Safe Pro Enterprise', seats: undefined }
}

export const getWorkspaceProfile = (scenario: Scenario) => {
  const accounts = getScenarioAccounts(scenario)
  const signers = [...new Set(accounts.flatMap((account) => account.owners))]
  const outside = signers.filter((id) => !isWorkspaceMember(id)).length
  const nonSigners = Object.values(PERSONAS).filter((profile) => !profile.you).length
  return {
    // The fixture workspace is a crypto-native company running its own treasury, payroll and grants.
    segment:
      scenario === 'protocol' || scenario === 'fleet'
        ? `Protocol team · ${new Set(accounts.map((account) => account.network)).size} chains`
        : 'Crypto-native company · Manages onchain capital',
    plan: getPlan(accounts.length),
    safes: accounts.length,
    members: signers.length - outside + nonSigners,
    signers: signers.length,
    outside,
  }
}

export const getSignerStatus = (persona: Persona, accounts: Account[]) => {
  const signs = accounts.filter((account) => isSignerOf(account, persona))
  if (!signs.length) return 'Not a signer'
  if (signs.length === 1) return `Signs 1 Safe (${signs[0].name})`
  return `Signs ${signs.length} of ${accounts.length} Safes`
}

export const getPersonaAddress = (persona: Persona) =>
  getSignerIdentity(getYou(persona) ?? PERSONAS[persona].address!).address

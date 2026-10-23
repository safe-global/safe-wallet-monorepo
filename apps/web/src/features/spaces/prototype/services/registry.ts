import type { PolicyStatus, PolicyType } from '@safe-global/views/features/spaces/components/Policies/types'
import { POLICY_TYPE_LABELS } from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import type { Account } from '../types'
import { UNNAMED_SIGNER } from './model'

// Fleet admin: what a team records about each Safe, beyond what is onchain.
type Entry = { purpose?: string; contact?: string }
// One entry per Safe, shared by its deployments on every network. Keepers is the registry gap.
const REGISTRY: Record<string, Entry> = {
  Treasury: { purpose: 'Holds the main reserves and funds the other Safes.', contact: 'Dev' },
  'DAO reserve': { purpose: 'Long-term reserve, moved only after a governance vote.', contact: 'Ana' },
  Vesting: { purpose: 'Releases team and investor tokens on schedule.', contact: 'Lena' },
  'Security council': { purpose: 'Pauses contracts and responds to incidents.', contact: 'Jonas' },
  'Bridge escrow': { purpose: 'Holds bridged assets and can halt the bridge.', contact: 'Theo' },
  Liquidity: { purpose: 'Provides liquidity to exchange pools.', contact: 'Max' },
  'Market making': { purpose: 'Runs market making with approved partners.', contact: 'Kai' },
  Keepers: {},
  Grants: { purpose: 'Pays out approved ecosystem grants.', contact: 'Nadia' },
  Payroll: { purpose: 'Pays contributors every month.', contact: 'Sam' },
}

// "Treasury Ethereum" and "Treasury Base" are one Safe on two networks.
export const getSafeGroup = (account: Account) =>
  account.name.endsWith(` ${account.network}`) ? account.name.slice(0, -account.network.length - 1) : account.name

export const getRegistry = (account: Account): Entry & { group: string } => {
  const group = getSafeGroup(account)
  return { group, ...REGISTRY[group] }
}

export type WalletType = 'Ledger' | 'Trezor' | 'MPC' | 'Browser wallet' | 'Unknown'
const WALLETS: Record<string, WalletType> = {
  Dev: 'Ledger',
  Ana: 'Trezor',
  Max: 'Ledger',
  Jonas: 'Ledger',
  Lena: 'Trezor',
  Theo: 'MPC',
  Kai: 'Browser wallet',
  Nadia: 'Ledger',
  Sam: 'Browser wallet',
  Omar: 'Browser wallet',
}
export const getWallet = (signer: string): WalletType => WALLETS[signer] ?? 'Unknown'

// A signed challenge from each signer before a Safe counts as active.
export type Attestation = 'attested' | 'pending' | 'missing'
const ATTESTATIONS: Record<string, Attestation> = {
  [`Security council:${UNNAMED_SIGNER}`]: 'missing',
  'DAO reserve:Omar': 'pending',
  'Payroll:Sam': 'missing',
}
export const getAttestation = (account: Account, signer: string): Attestation =>
  ATTESTATIONS[`${getSafeGroup(account)}:${signer}`] ?? 'attested'
export const ATTESTATION_LABELS: Record<Attestation, string> = {
  attested: 'Attested',
  pending: 'Pending',
  missing: 'Missing',
}

// The Policies set up on each Safe, with the types and statuses of the Policies page. Allowlist is M2.
export type SafePolicyType = PolicyType | 'allowlist'
export type SafePolicy = { type: SafePolicyType; status: PolicyStatus }
const POLICIES: Record<string, SafePolicy[]> = {
  Treasury: [
    { type: 'recovery', status: 'active' },
    { type: 'allowlist', status: 'active' },
  ],
  'DAO reserve': [{ type: 'recovery', status: 'active' }],
  'Security council': [{ type: 'proposer', status: 'active' }],
  'Bridge escrow': [{ type: 'allowlist', status: 'pending' }],
  Liquidity: [{ type: 'spending-limit', status: 'active' }],
  'Market making': [
    { type: 'spending-limit', status: 'active' },
    { type: 'allowlist', status: 'active' },
  ],
  Keepers: [{ type: 'proposer', status: 'active' }],
  Grants: [{ type: 'spending-limit', status: 'active' }],
  Payroll: [{ type: 'spending-limit', status: 'active' }],
}
export const getPolicies = (account: Account) => POLICIES[getSafeGroup(account)] ?? []
export const POLICY_LABELS: Record<SafePolicyType, string> = { ...POLICY_TYPE_LABELS, allowlist: 'Allowlist' }

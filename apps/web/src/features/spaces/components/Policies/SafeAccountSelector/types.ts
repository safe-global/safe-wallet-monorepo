import type { ChainInfo } from '@/features/spaces/types'

/** Why the wallet may set a policy on a Safe. Drives no UI yet; read by the flow gate. */
export type SafeAccountEligibility = 'signer' | 'proposer' | 'signer-and-proposer'

/** One selectable entry: a Safe on exactly one chain. */
export type SafeAccountOption = {
  /** `${chainId}:${address}` — the form value. */
  id: string
  chainId: string
  address: string
  name?: string
  threshold?: number
  owners?: number
  eligibility: SafeAccountEligibility
  /** Absent until the chain configs load. */
  chain?: ChainInfo
  /** Absent until the overview resolves. */
  fiatTotal?: string
}

/** A Safe eligible on more than one chain: a non-selectable header plus its per-chain entries. */
export type SafeAccountGroup = {
  address: string
  name?: string
  accounts: SafeAccountOption[]
  /** Absent when no member chain has resolved one. */
  fiatTotal?: string
  /** Absent when the chains differ or one is unresolved. */
  threshold?: number
  owners?: number
}

export type SafeAccountEntry = SafeAccountOption | SafeAccountGroup

export const isSafeAccountGroup = (entry: SafeAccountEntry): entry is SafeAccountGroup => 'accounts' in entry

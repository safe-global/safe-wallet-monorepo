import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { parseSafeScopeKey } from '@/components/tx-flow/safe-scope'
import { isSafeAccountGroup, type SafeAccountEntry, type SafeAccountOption } from '../../SafeAccountSelector/types'
import type { SpendingLimitPolicyFormValues } from '../types'
import { findTokenOption, type TokenOption } from '../utils/tokenOptions'
import type { LimitSummaryToken, SpendingLimitSummaryModel } from './types'

export type PolicySummarySources = {
  /** The eligible accounts the step-1 selector offered (groups included). */
  accounts: readonly SafeAccountEntry[]
  /** The token options for the selected Safe's chain. */
  tokens: readonly TokenOption[]
  /** Address → name, as `useAddressBook()` returns it. */
  names: Readonly<Record<string, string>>
}

const flattenAccounts = (entries: readonly SafeAccountEntry[]): SafeAccountOption[] =>
  entries.flatMap((entry) => (isSafeAccountGroup(entry) ? entry.accounts : [entry]))

/** The selected option, or a minimal one from the scope key while the eligible list has not resolved it. */
const resolveSafe = (safeId: string, accounts: readonly SafeAccountEntry[]): SafeAccountOption => {
  const match = flattenAccounts(accounts).find((account) => account.id === safeId)
  if (match) return match

  const target = parseSafeScopeKey(safeId)
  return { id: safeId, chainId: target?.chainId ?? '', address: target?.safeAddress ?? safeId, eligibility: 'signer' }
}

const resolveToken = (tokenAddress: string, tokens: readonly TokenOption[]): LimitSummaryToken => {
  const match = findTokenOption(tokens, tokenAddress)
  return match
    ? { address: match.address, symbol: match.symbol, decimals: match.decimals, logoUri: match.logoUri }
    : { address: tokenAddress, symbol: shortenAddress(tokenAddress) }
}

/** Address books are keyed by checksummed address; the form value may not be. */
const resolveName = (address: string, names: Readonly<Record<string, string>>): string | undefined =>
  Object.entries(names).find(([known]) => sameAddress(known, address))?.[1]

/** Maps the step-1 form values onto what the summary renders. Pure, so the Review step can memoise it. */
export const toPolicySummaryModel = (
  values: SpendingLimitPolicyFormValues,
  { accounts, tokens, names }: PolicySummarySources,
): SpendingLimitSummaryModel => ({
  safe: resolveSafe(values.safe, accounts),
  spenders: values.spenders.map((spender) => ({
    address: spender.address,
    name: resolveName(spender.address, names),
    limits: spender.limits.map((limit) => ({
      token: resolveToken(limit.tokenAddress, tokens),
      amount: limit.amount,
      resetTimeMin: limit.resetTime,
    })),
  })),
})

import { sameAddress } from '@safe-global/utils/utils/addresses'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { buildSafeScopeKey } from '@/components/tx-flow/safe-scope/utils'
import type { SafeAccountEntry, SafeAccountOption } from '../../SafeAccountSelector/types'
import { flattenSafeAccounts } from '../../SafeAccountSelector/utils'
import type { PolicySafe, PolicySpender } from '../../types'
import { resolveName, resolveSafe } from './toPolicySummaryModel'
import type { SpendingLimitSummaryModel } from './types'

/** The indexer's address casing need not match the account list's, so the Safe is matched by address, not by id. */
const findSafe = (safe: PolicySafe, accounts: readonly SafeAccountEntry[]): SafeAccountOption =>
  flattenSafeAccounts([...accounts]).find(
    (account) => account.chainId === safe.chainId && sameAddress(account.address, safe.address),
  ) ?? resolveSafe(buildSafeScopeKey(safe.chainId, safe.address), [])

/** The limits a re-enabled module applies again, as the indexer holds them, in the shape the confirm step renders. */
export const toEnableModuleSummaryModel = (
  safe: PolicySafe,
  spenders: readonly PolicySpender[],
  { accounts, names }: { accounts: readonly SafeAccountEntry[]; names: Readonly<Record<string, string>> },
): SpendingLimitSummaryModel => ({
  safe: findSafe(safe, accounts),
  spenders: spenders.map(({ spender, allowances }) => ({
    address: spender,
    name: resolveName(spender, names),
    limits: allowances.map(({ token, amount, resetPeriodMinutes }) => ({
      token: {
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        logoUri: token.logoUri ?? undefined,
      },
      amount: safeFormatUnits(amount, token.decimals),
      resetTimeMin: String(resetPeriodMinutes),
    })),
  })),
})

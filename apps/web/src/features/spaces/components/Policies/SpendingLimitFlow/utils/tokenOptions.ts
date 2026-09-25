import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { TokenType } from '@safe-global/store/gateway/types'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { TokensGetTokensV1ApiResponse } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'

export type TokenMetadata = TokensGetTokensV1ApiResponse[number]

export type PopularToken = {
  symbol: string
  name: string
  address: string
  decimals: number
  logoUri: string
}

export const toPopularToken = (token: TokenMetadata): PopularToken => ({
  symbol: token.symbol,
  name: token.name,
  address: token.address,
  decimals: token.decimals,
  logoUri: token.logoUri,
})

export type TokenOptionGroup = 'held' | 'popular'

/** One selectable token. `group` decides which section it renders in and whether a balance is shown. */
export type TokenOption = {
  /** `ZERO_ADDRESS` for the native currency. */
  address: string
  symbol: string
  name: string
  decimals: number
  logoUri?: string
  group: TokenOptionGroup
  /** Raw units; held tokens only. */
  balance?: string
  /** Held tokens only. */
  fiatBalance?: string
  /** Held tokens only: the fiat price of one whole token. */
  fiatConversion?: string
}

export type NativeCurrencyInfo = {
  symbol: string
  name: string
  decimals: number
  logoUri: string
}

export type BuildTokenOptionsInput = {
  /** `undefined` while the balances have not loaded (or the Safe is undeployed). */
  balances?: readonly Balance[]
  popular: readonly PopularToken[]
  /** Omit on chains with `HIDE_NATIVE_TOKEN`. */
  native?: NativeCurrencyInfo
  /** False on `HIDE_NATIVE_TOKEN` chains, where the balances API still returns the native token. */
  showNative?: boolean
}

const toHeldOption = (balance: Balance): TokenOption => ({
  address: balance.tokenInfo.address,
  symbol: balance.tokenInfo.symbol,
  name: balance.tokenInfo.name,
  decimals: balance.tokenInfo.decimals,
  logoUri: balance.tokenInfo.logoUri || undefined,
  group: 'held',
  balance: balance.balance,
  fiatBalance: balance.fiatBalance,
  fiatConversion: balance.fiatConversion,
})

const toPopularOption = (token: PopularToken): TokenOption => ({
  address: token.address,
  symbol: token.symbol,
  name: token.name,
  decimals: token.decimals,
  logoUri: token.logoUri || undefined,
  group: 'popular',
})

const byFiatDescThenSymbol = (a: TokenOption, b: TokenOption): number => {
  const fiatDiff = Number(b.fiatBalance ?? 0) - Number(a.fiatBalance ?? 0)
  return fiatDiff !== 0 ? fiatDiff : a.symbol.localeCompare(b.symbol)
}

/** Zero balances are kept so a limit can be set before funding; held wins on a duplicate address. */
export const buildTokenOptions = ({
  balances,
  popular,
  native,
  showNative = true,
}: BuildTokenOptionsInput): TokenOption[] => {
  const held = (balances ?? [])
    .filter((balance) => balance.tokenInfo.type !== TokenType.ERC721)
    .filter((balance) => showNative || balance.tokenInfo.type !== TokenType.NATIVE_TOKEN)
    .map(toHeldOption)
    .sort(byFiatDescThenSymbol)

  const candidates: PopularToken[] = [...(native ? [{ ...native, address: ZERO_ADDRESS }] : []), ...popular]

  // Native first, then the popular table's own order — product-defined, so it is never sorted here.
  const popularOptions = candidates
    .filter((candidate) => !held.some((option) => sameAddress(option.address, candidate.address)))
    .map(toPopularOption)

  return [...held, ...popularOptions]
}

export const findTokenOption = (
  options: readonly TokenOption[],
  address: string | undefined,
): TokenOption | undefined => (address ? options.find((option) => sameAddress(option.address, address)) : undefined)

/** What the input shows for a selected option: symbol, else name, else the shortened address. */
export const tokenOptionLabel = (option: TokenOption): string =>
  option.symbol || option.name || shortenAddress(option.address)

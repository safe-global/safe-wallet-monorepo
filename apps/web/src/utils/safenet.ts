import type { SafenetBalanceEntity, SafenetConfigEntity } from '@/store/safenet'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'
import type { Balances, Token } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

export type SafenetBalance = {
  chainId: string
  symbol: string
  decimals: number
  balance: string
  fiatBalance: string
}

export type SafenetToken = {
  tokenInfo: Token
  balance: string
  fiatBalance: string
  fiatConversion: string
  safenetBalance?: SafenetBalance[]
}

export type BalancesSafenet = {
  fiatTotal: string
  items: SafenetToken[]
}

export const convertSafenetBalanceToSafeClientGatewayBalance = (
  safenetBalance: SafenetBalanceEntity,
  safenetConfig: SafenetConfigEntity,
  chainId: number,
  currency: string,
): BalancesSafenet => {
  const balances: BalancesSafenet = {
    fiatTotal: safenetBalance['USDC'].total,
    items: [],
  }

  for (const [tokenName, balance] of Object.entries(safenetBalance)) {
    const tokenAddress = safenetConfig.tokens[tokenName][chainId]
    if (!tokenAddress) {
      continue
    }

    const decimals = tokenName === 'USDC' || tokenName === 'USDT' ? 6 : 18

    let balanceBreakdown: SafenetBalance[] = []
    for (const [chainId, breakdown] of Object.entries(balance.breakdown)) {
      balanceBreakdown.push({
        chainId,
        symbol: tokenName,
        decimals,
        balance: breakdown.balance,
        fiatBalance: currency === 'usd' ? ((parseInt(breakdown.balance) * 1) / 10 ** decimals).toString() : '0',
      })
    }

    balances.items.push({
      tokenInfo: {
        type: TokenType.ERC20,
        address: tokenAddress,
        decimals,
        symbol: tokenName,
        name: tokenName,
        logoUri: `https://assets.smold.app/api/token/${chainId}/${tokenAddress}/logo-128.png`,
      },
      balance: balance.total,
      fiatBalance: currency === 'usd' ? ((parseInt(balance.total) * 1) / 10 ** decimals).toString() : '0',
      fiatConversion: currency === 'usd' ? '1' : '0',
      safenetBalance: balanceBreakdown,
    })
  }

  return balances
}

export const mergeBalances = (cgw: Balances, safenet: Balances): Balances => {
  // Create a Map using token addresses as keys
  const uniqueBalances = new Map(
    // Process Safenet items last so they take precedence by overwriting the CGW items
    [...cgw.items, ...safenet.items].map((item) => [item.tokenInfo.address, item]),
  )

  return {
    // We do not sum the fiatTotal as Safenet doesn't return it
    // And if it did, we would have to do something fancy with calculations so balances aren't double counted
    fiatTotal: Array.from(uniqueBalances.values())
      .reduce((acc, item) => acc + parseFloat(item.fiatBalance), 0)
      .toString(),
    items: Array.from(uniqueBalances.values()),
  }
}

import type { SafenetBalanceEntity, SafenetConfigEntity } from '@/store/safenet'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'

export type SafenetBalance = {
  chainId: string
  symbol: string
  decimals: number
  balance: string
  fiatBalance: string
  pendingSettlements: string
}

export type SafenetToken = {
  tokenInfo: TokenInfo
  balance: string
  fiatBalance: string
  fiatConversion: string
  safenetBalance?: SafenetBalance[]
}

export type SafeBalanceResponseWithSafenet = {
  fiatTotal: string
  items: SafenetToken[]
}

const convertSafenetBalanceToSafeClientGatewayBalance = (
  safenetBalance: SafenetBalanceEntity,
  safenetConfig: SafenetConfigEntity,
  chainId: number,
  currency: string,
): SafeBalanceResponseWithSafenet => {
  const balances: SafeBalanceResponseWithSafenet = {
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
        balance: breakdown.total,
        fiatBalance: currency === 'usd' ? ((parseInt(breakdown.balance) * 1) / 10 ** decimals).toString() : '0',
        pendingSettlements: breakdown.pendingSettlements,
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

export { convertSafenetBalanceToSafeClientGatewayBalance }

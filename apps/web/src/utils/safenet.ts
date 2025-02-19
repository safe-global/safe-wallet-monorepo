import type { SafenetBalanceEntity, SafenetConfigEntity } from '@/store/safenet'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'

export type SafenetBalance = {
  chainId: string
  symbol: string
  decimals: number
  balance: string
  fiatBalance: string
}

export type SafeBalanceResponseWithSafenet = {
  fiatTotal: string
  items: Array<{
    tokenInfo: TokenInfo
    balance: string
    fiatBalance: string
    fiatConversion: string
    safenetBalance?: SafenetBalance[]
  }>
}

const convertSafenetBalanceToSafeClientGatewayBalance = (
  safenetBalance: SafenetBalanceEntity,
  safenetConfig: SafenetConfigEntity,
  chainId: number,
): SafeBalanceResponseWithSafenet => {
  const balances: SafeBalanceResponseWithSafenet = {
    fiatTotal: '0',
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
        fiatBalance: ((parseInt(breakdown.balance) * 1) / 10 ** decimals).toString(),
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
      fiatBalance: ((parseInt(balance.total) * 1) / 10 ** decimals).toString(),
      fiatConversion: '1.00',
      safenetBalance: balanceBreakdown,
    })
  }

  return balances
}

export { convertSafenetBalanceToSafeClientGatewayBalance }

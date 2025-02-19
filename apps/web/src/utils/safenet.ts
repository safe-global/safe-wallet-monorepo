import type { SafenetBalanceEntity, SafenetConfigEntity } from '@/store/safenet'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'

export type SafeBalanceResponseWithSafenet = {
  fiatTotal: string
  items: Array<{
    tokenInfo: TokenInfo
    balance: string
    fiatBalance: string
    fiatConversion: string
    safenetAssetFlag?: boolean
  }>
}

const convertSafenetBalanceToSafeClientGatewayBalance = (
  safenetBalance: SafenetBalanceEntity,
  safenetConfig: SafenetConfigEntity,
  chainId: number,
): SafeBalanceResponseWithSafenet => {
  const balances: SafeBalanceResponseWithSafenet = {
    fiatTotal: safenetBalance.fiatTotal.total,
    items: [],
  }

  for (const [tokenName, balance] of Object.entries(safenetBalance)) {
    const tokenAddress = safenetConfig.tokens[tokenName][chainId]
    if (!tokenAddress) {
      continue
    }

    const decimals = tokenName === 'USDC' || tokenName === 'USDT' ? 6 : 18

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
      safenetAssetFlag: true,
    })
  }

  return balances
}

export { convertSafenetBalanceToSafeClientGatewayBalance }

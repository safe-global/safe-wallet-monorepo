import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import type { AppBalance } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'

export const transformAppBalancesToProtocols = (appBalances?: AppBalance[]): Protocol[] | undefined => {
  if (!appBalances) return undefined

  return appBalances.map((appBalance) => ({
    protocol: appBalance.appInfo.name,
    protocol_metadata: {
      name: appBalance.appInfo.name,
      icon: {
        url: appBalance.appInfo.logoUrl ?? null,
      },
    },
    fiatTotal: appBalance.balanceFiat,
    items: appBalance.groups.map((group) => ({
      name: group.name,
      items: group.items.map((position) => ({
        balance: position.balance,
        fiatBalance: position.balanceFiat || '0',
        fiatConversion: '0',
        tokenInfo: {
          ...position.tokenInfo,
          logoUri: position.tokenInfo.logoUri || '',
        },
        fiatBalance24hChange: position.priceChangePercentage1d ?? null,
        position_type: (position.type as Protocol['items'][0]['items'][0]['position_type']) || null,
      })),
    })),
  }))
}

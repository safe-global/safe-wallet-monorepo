import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

export const calculateProtocolFiatChange = (protocol: Protocol): number | null => {
  const totalFiat = Number(protocol.fiatTotal)
  if (totalFiat === 0) {
    return null
  }

  let totalChange = 0
  let hasAnyChange = false

  for (const group of protocol.items) {
    for (const position of group.items) {
      if (position.fiatBalance24hChange != null) {
        hasAnyChange = true
        const fiatBalance = Number(position.fiatBalance)
        const changePercent = Number(position.fiatBalance24hChange) / 100
        totalChange += fiatBalance * changePercent
      }
    }
  }

  if (!hasAnyChange) {
    return null
  }

  return totalChange / totalFiat
}

import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { parseFiatChange } from '@safe-global/utils/utils/fiatChange'

export const calculateProtocolFiatChange = (protocol: Protocol): number | null => {
  const totalFiat = Number(protocol.fiatTotal)
  if (totalFiat === 0) {
    return null
  }

  let totalChange = 0
  let hasAnyChange = false

  // A position we cannot parse is skipped, not fatal — one bad row must not hide the protocol total.
  for (const group of protocol.items) {
    for (const position of group.items) {
      const changePercent = parseFiatChange(position.fiatBalance24hChange)
      const fiatBalance = Number(position.fiatBalance)
      if (changePercent === null || !Number.isFinite(fiatBalance)) {
        continue
      }

      hasAnyChange = true
      totalChange += fiatBalance * changePercent
    }
  }

  if (!hasAnyChange) {
    return null
  }

  const ratio = totalChange / totalFiat

  return Number.isFinite(ratio) ? ratio : null
}

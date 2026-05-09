export const calculateProtocolPercentage = (protocolFiatTotal: string, totalFiatValue: number): number => {
  if (totalFiatValue === 0) {
    return 0
  }

  return Number(protocolFiatTotal) / totalFiatValue
}

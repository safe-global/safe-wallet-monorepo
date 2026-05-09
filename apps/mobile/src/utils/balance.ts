export const shouldDisplayPreciseBalance = (balanceAmount: string, integerPartLength = 8) => {
  return balanceAmount.split('.')[0].length < integerPartLength
}

/** Sum an array of fiat total strings into a single string total. */
export const sumFiatTotals = (totals: string[]): string => {
  return totals.reduce((acc, val) => acc + parseFloat(val), 0).toString()
}

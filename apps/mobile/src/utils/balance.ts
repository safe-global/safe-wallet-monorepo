export const shouldDisplayPreciseBalance = (balanceAmount: string, integerPartLength = 8) => {
  return balanceAmount.split('.')[0].length < integerPartLength
}

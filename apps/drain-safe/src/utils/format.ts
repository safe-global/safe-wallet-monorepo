import { formatUnits } from 'viem'

export const formatTokenAmount = (balance: string, decimals: number | null | undefined): string =>
  formatUnits(BigInt(balance), decimals ?? 0)

export const formatFiat = (value: number | string, currency: string): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value))

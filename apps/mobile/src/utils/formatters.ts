import { SwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { formatUnits } from 'ethers'

type Quantity = {
  amount: string | number | bigint
  decimals: number
}

function asDecimal(amount: number | bigint, decimals: number): number {
  return Number(formatUnits(amount, decimals))
}

export const ellipsis = (str: string, length: number): string => {
  return str.length > length ? `${str.slice(0, length)}...` : str
}

export const makeSafeId = (chainId: string, address: string) => `${chainId}:${address}` as `${number}:0x${string}`

export const shortenAddress = (address: string, length = 4): string => {
  if (!address) {
    return ''
  }

  return `${address.slice(0, length + 2)}...${address.slice(-length)}`
}

export const formatValue = (value: string, decimals: number): string => {
  return (parseInt(value) / 10 ** decimals).toString().substring(0, 8)
}

export const getLimitPrice = (
  order: Pick<SwapOrderTransactionInfo, 'sellAmount' | 'buyAmount' | 'buyToken' | 'sellToken'>,
): number => {
  const { sellAmount, buyAmount, buyToken, sellToken } = order

  const ratio = calculateRatio(
    { amount: sellAmount, decimals: sellToken.decimals },
    { amount: buyAmount, decimals: buyToken.decimals },
  )

  return ratio
}

const calculateRatio = (a: Quantity, b: Quantity) => {
  if (BigInt(b.amount) === 0n) {
    return 0
  }
  return asDecimal(BigInt(a.amount), a.decimals) / asDecimal(BigInt(b.amount), b.decimals)
}

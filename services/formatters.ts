import { BigNumber } from 'bignumber.js'

export const formatDecimals = (value: string, decimals = 18): string => {
  return new BigNumber(value).times(`1e-${decimals}`).toFixed()
}

export const toDecimals = (value: string, decimals = 18): BigNumber => {
  return new BigNumber(value).div(`1e-${decimals}`)
}

export const shortenAddress = (address: string, length = 4): string => {
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`
}

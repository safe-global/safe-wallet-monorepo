import { getAddress } from 'ethers/lib/utils'
import { isAddress } from '@ethersproject/address'

export const sameAddress = (firstAddress: string | undefined, secondAddress: string | undefined): boolean => {
  if (!firstAddress || !secondAddress) {
    return false
  }

  return firstAddress.toLowerCase() === secondAddress.toLowerCase()
}

export type PrefixedAddress = {
  prefix?: string
  address: string
}

export const parsePrefixedAddress = (value: string): PrefixedAddress => {
  const [prefix, address] = value.split(':')

  return {
    prefix: address ? prefix : undefined,
    address: isAddress(address) ? getAddress(address) : value,
  }
}

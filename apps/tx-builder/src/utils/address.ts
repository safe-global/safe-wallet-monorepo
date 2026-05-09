import { getAddress, isAddress, isHexString } from 'ethers'

const getAddressWithoutNetworkPrefix = (address = ''): string => {
  const hasPrefix = address.includes(':')

  if (!hasPrefix) {
    return address
  }

  const [, ...addressWithoutNetworkPrefix] = address.split(':')

  return addressWithoutNetworkPrefix.join('')
}

const getNetworkPrefix = (address = ''): string => {
  const splitAddress = address.split(':')
  const hasPrefixDefined = splitAddress.length > 1
  const [prefix] = splitAddress
  return hasPrefixDefined ? prefix : ''
}

const addNetworkPrefix = (address: string, prefix: string | undefined): string => {
  return prefix ? `${prefix}:${address}` : address
}

const checksumAddress = (address: string): string => getAddress(address)

const isChecksumAddress = (address?: string): boolean => {
  if (address) {
    try {
      return getAddress(address) === address
    } catch {
      return false
    }
  }
  return false
}

const isValidAddress = (address?: string): boolean => {
  if (address) {
    return isHexString(address, 20) && isAddress(address)
  }

  return false
}

// Based on https://docs.ens.domains/dapp-developer-guide/resolving-names
// [...] a correct integration of ENS treats any dot-separated name as a potential ENS name [...]
const validENSRegex = new RegExp(/[^[\]]+\.[^[\]]/)
const isValidEnsName = (name: string): boolean => validENSRegex.test(name)

export {
  getAddressWithoutNetworkPrefix,
  getNetworkPrefix,
  addNetworkPrefix,
  checksumAddress,
  isChecksumAddress,
  isValidAddress,
  isValidEnsName,
}

import { AddressInfo, SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

export const extractSignersFromSafes = (safes: { owners: AddressInfo[] }[]): Record<string, AddressInfo> => {
  return safes.reduce((acc, safe) => {
    const owners = safe.owners
      .map((owner) => owner)
      .reduce((acc, owner) => {
        return {
          ...acc,
          [owner.value]: owner,
        }
      }, {})
    return {
      ...acc,
      ...owners,
    }
  }, {})
}
export const extractChainsFromSafes = (safes: SafeOverview[]) => {
  return safes.map((safe) => safe.chainId)
}

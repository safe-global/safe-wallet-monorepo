import { BEACON_CHAIN_EXPLORERS } from '../constants'

export const getBeaconChainLink = (chainId: string, validator: string) => {
  return `${
    BEACON_CHAIN_EXPLORERS[chainId as keyof typeof BEACON_CHAIN_EXPLORERS] ?? 'https://beaconcha.in'
  }/validator/${validator}`
}

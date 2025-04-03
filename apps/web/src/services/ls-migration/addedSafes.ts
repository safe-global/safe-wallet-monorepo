import { type AddedSafesState, type AddedSafesOnChain } from '@/store/addedSafesSlice'
import type { LOCAL_STORAGE_DATA } from './common'
import { parseLsValue } from './common'
import { isChecksummedAddress } from '@safe-global/utils/utils/addresses'
import isObject from 'lodash/isObject'
import type { AddressEx } from '@safe-global/safe-gateway-typescript-sdk'

const IMMORTAL_PREFIX = '_immortal|v2_'

const CHAIN_PREFIXES: Record<string, string> = {
  '1': 'MAINNET',
  '56': 'BSC',
  '100': 'XDAI',
  '137': 'POLYGON',
  '246': 'ENERGY_WEB_CHAIN',
  '42161': 'ARBITRUM',
  '73799': 'VOLTA',
}
const ALL_CHAINS = ['1', '100', '137', '56', '246', '42161', '1313161554', '43114', '10', '5', '73799']

const OLD_LS_KEY = '__SAFES'

type OldAddedSafes = Record<
  string,
  {
    address: string
    chainId: string
    ethBalance: string
    owners: Array<string | { name?: string; address: string }>
    threshold: number
  }
>

export const migrateAddedSafesOwners = (
  owners: OldAddedSafes[string]['owners'],
): AddedSafesState[string][string]['owners'] | undefined => {
  const migratedOwners = owners
    .map((value) => {
      if (typeof value === 'string' && isChecksummedAddress(value)) {
        return { value }
      }

      if (isObject(value) && typeof value.address === 'string' && isChecksummedAddress(value.address)) {
        const owner: AddressEx = {
          value: value.address,
          ...(typeof value.name === 'string' && { name: value.name }),
        }
        return owner
      }
    })
    .filter((owner): owner is AddressEx => !!owner)

  return migratedOwners.length > 0 ? migratedOwners : undefined
}

export const migrateAddedSafes = (lsData: LOCAL_STORAGE_DATA): AddedSafesState | void => {
  const newAddedSafes: AddedSafesState = {}

  ALL_CHAINS.forEach((chainId) => {
    const chainPrefix = CHAIN_PREFIXES[chainId] || chainId
    const legacyAddedSafes = parseLsValue<OldAddedSafes>(lsData[IMMORTAL_PREFIX + chainPrefix + OLD_LS_KEY])

    if (legacyAddedSafes && Object.keys(legacyAddedSafes).length > 0) {
      console.log('Migrating added Safe Accounts on chain', chainId)

      const safesPerChain = Object.values(legacyAddedSafes).reduce<AddedSafesOnChain>((acc, oldItem) => {
        const migratedOwners = migrateAddedSafesOwners(oldItem.owners)

        if (migratedOwners) {
          acc[oldItem.address] = {
            ethBalance: oldItem.ethBalance,
            owners: migratedOwners,
            threshold: oldItem.threshold,
          }
        }

        return acc
      }, {})

      if (Object.keys(safesPerChain).length > 0) {
        newAddedSafes[chainId] = safesPerChain
      }
    }
  })

  if (Object.keys(newAddedSafes).length > 0) {
    return newAddedSafes
  }
}

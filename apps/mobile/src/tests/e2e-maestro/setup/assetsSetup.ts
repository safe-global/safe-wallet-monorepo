import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { addContact } from '@/src/store/addressBookSlice'
import { Address } from '@/src/types/address'
import { assetsTestData, mockedActiveAccount } from './mockData'

/**
 * Setup for e2eOnboardedAccountTestAssets button
 * Creates multiple safes for asset testing and navigates to home
 */
export const setupOnboardedAccountForAssets = (dispatch: Dispatch, router: Router) => {
  const keys = Object.keys(assetsTestData.safes)
  Object.values(assetsTestData.safes).forEach((safe: SafeOverview, index) => {
    dispatch(
      addSafe({
        address: safe.address.value as Address,
        info: { [safe.chainId]: safe },
      }),
    )
    dispatch(
      addContact({
        value: safe.address.value as Address,
        name: keys[index],
        chainIds: [safe.chainId],
      }),
    )
  })
  dispatch(updatePromptAttempts(1))
  dispatch(setActiveSafe(mockedActiveAccount))
  router.replace('/(tabs)')
}


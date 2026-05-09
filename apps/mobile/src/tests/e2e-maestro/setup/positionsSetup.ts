import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { addContact } from '@/src/store/addressBookSlice'
import { Address } from '@/src/types/address'
import { positionsTestSafe, positionsTestSafeInfo } from './mockData'

/**
 * Setup for e2ePositionsTestSafe button
 * Creates a Polygon safe with AAVE V3 positions and navigates to home
 */
export const setupPositionsTestSafe = (dispatch: Dispatch, router: Router) => {
  dispatch(
    addSafe({
      address: positionsTestSafeInfo.address.value as Address,
      info: { [positionsTestSafeInfo.chainId]: positionsTestSafeInfo },
    }),
  )
  dispatch(
    addContact({
      value: positionsTestSafeInfo.address.value as Address,
      name: 'PositionsSafe',
      chainIds: [positionsTestSafeInfo.chainId],
    }),
  )
  dispatch(updatePromptAttempts(1))
  dispatch(setActiveSafe(positionsTestSafe))
  router.replace('/(tabs)')
}

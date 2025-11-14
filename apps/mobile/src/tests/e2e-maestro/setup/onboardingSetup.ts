import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { Address } from '@/src/types/address'
import { mockedActiveAccount, mockedActiveSafeInfo } from './mockData'

/**
 * Setup for e2eOnboardedAccount button
 * Creates a basic onboarded account and navigates to home
 */
export const setupOnboardedAccount = (dispatch: Dispatch, router: Router) => {
  dispatch(
    addSafe({
      address: mockedActiveSafeInfo.address.value as Address,
      info: { [mockedActiveSafeInfo.chainId]: mockedActiveSafeInfo },
    }),
  )
  dispatch(setActiveSafe(mockedActiveAccount))
  dispatch(updatePromptAttempts(1))
  router.replace('/(tabs)')
}

/**
 * Setup for e2eTestOnboarding button
 * Navigates directly to onboarding screen (fresh start)
 */
export const setupTestOnboarding = (router: Router) => {
  router.replace('/onboarding')
}

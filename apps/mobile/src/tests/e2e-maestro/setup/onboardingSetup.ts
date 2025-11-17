import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { Address } from '@/src/types/address'
import {
  mockedActiveAccount,
  mockedActiveSafeInfo,
  mockedSeedPhraseImportAccount,
  mockedSeedPhraseImportSafeInfo,
} from './mockData'

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

/**
 * Setup for e2eSeedPhraseImportAccount button
 * Creates a Safe account for seed phrase import testing
 * Safe: 0x4c425AceFf91aa4398183FE82e210C96dD9E92F8
 * Owner: 0xaE03f216A54857b995d79468882AfB07251B1154 (default address from seed phrase)
 */
export const setupSeedPhraseImportAccount = (dispatch: Dispatch, router: Router) => {
  dispatch(
    addSafe({
      address: mockedSeedPhraseImportSafeInfo.address.value as Address,
      info: { [mockedSeedPhraseImportSafeInfo.chainId]: mockedSeedPhraseImportSafeInfo },
    }),
  )
  dispatch(setActiveSafe(mockedSeedPhraseImportAccount))
  dispatch(updatePromptAttempts(1))
  router.replace('/(tabs)')
}

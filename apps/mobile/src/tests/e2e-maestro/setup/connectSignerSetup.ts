import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { walletConnectE2eState } from '@/src/features/WalletConnect/context/walletConnectE2eState'
import { mockedActiveAccount, mockedActiveSafeInfo } from './mockData'
import { Address } from '@/src/types/address'

/** First owner from the mocked Safe — used for the happy path. */
const OWNER_ADDRESS = mockedActiveSafeInfo.owners[0].value

/** Address that is NOT an owner of the test Safe — used for the error path. */
const NON_OWNER_ADDRESS = '0x000000000000000000000000000000000000dEaD'

const WALLET_NAME = 'E2E Wallet'
/** 1x1 green PNG pixel — avoids external URL dependency in tests. */
const WALLET_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/**
 * Set the WC e2e state for the next connection attempt.
 * Does NOT touch Redux or navigation.
 */
const setWcState = (address: string, isOwner: boolean) => {
  walletConnectE2eState.set({
    connectResult: { address, walletName: WALLET_NAME, walletIcon: WALLET_ICON },
    isOwner,
  })
}

/** Onboard with the test Safe and navigate to home. */
const onboardAndNavigate = (dispatch: Dispatch, router: Router) => {
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
 * Switch the WC e2e state to resolve as an owner on the next connection attempt.
 * Use mid-test on the error screen before tapping "Connect a different wallet".
 */
export const switchToOwnerState = () => setWcState(OWNER_ADDRESS, true)

/** Setup happy path: onboard + configure WC mock to return an owner address. */
export const setupConnectSignerOwner = (dispatch: Dispatch, router: Router) => {
  walletConnectE2eState.reset()
  setWcState(OWNER_ADDRESS, true)
  onboardAndNavigate(dispatch, router)
}

/** Setup error path: onboard + configure WC mock to return a non-owner address. */
export const setupConnectSignerNonOwner = (dispatch: Dispatch, router: Router) => {
  walletConnectE2eState.reset()
  setWcState(NON_OWNER_ADDRESS, false)
  onboardAndNavigate(dispatch, router)
}

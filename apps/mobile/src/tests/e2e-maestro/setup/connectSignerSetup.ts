import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { walletConnectE2eState } from '@/src/features/WalletConnect/context/walletConnectE2eState'
import { mockedActiveAccount, mockedActiveSafeInfo } from './mockData'
import { Address } from '@/src/types/address'

/**
 * Known owner of the test Safe (0x2f3e...Fbb6 on Sepolia).
 * Used for the happy path: ownership validation will succeed.
 */
const OWNER_ADDRESS = '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472'

/**
 * Random address that is NOT an owner of the test Safe.
 * Used for the error path: ownership validation will fail.
 */
const NON_OWNER_ADDRESS = '0x000000000000000000000000000000000000dEaD'

const WALLET_NAME = 'E2E Wallet'
const WALLET_ICON = 'https://safe-wallet-web.dev.5afe.dev/images/safe-logo-green.png'

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

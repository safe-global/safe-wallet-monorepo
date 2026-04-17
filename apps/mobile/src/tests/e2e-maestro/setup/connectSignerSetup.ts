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

/**
 * Setup happy path: connect a wallet that IS an owner of the active Safe.
 *
 * - Onboards with the test Safe
 * - Configures walletConnectE2eState to resolve with an owner address
 * - Navigates to the tabs (home)
 */
export const setupConnectSignerOwner = (dispatch: Dispatch, router: Router) => {
  walletConnectE2eState.reset()
  walletConnectE2eState.set({
    connectResult: {
      address: OWNER_ADDRESS,
      walletName: 'E2E Wallet',
      walletIcon: 'https://safe-wallet-web.dev.5afe.dev/images/safe-logo-green.png',
    },
    isOwner: true,
  })

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
 * Setup error path: connect a wallet that is NOT an owner of the active Safe.
 *
 * - Onboards with the test Safe
 * - Configures walletConnectE2eState to resolve with a non-owner address
 * - Navigates to the tabs (home)
 */
export const setupConnectSignerNonOwner = (dispatch: Dispatch, router: Router) => {
  walletConnectE2eState.reset()
  walletConnectE2eState.set({
    connectResult: {
      address: NON_OWNER_ADDRESS,
      walletName: 'E2E Wallet',
      walletIcon: 'https://safe-wallet-web.dev.5afe.dev/images/safe-logo-green.png',
    },
    isOwner: false,
  })

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

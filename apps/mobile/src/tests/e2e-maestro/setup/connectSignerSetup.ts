import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { addSigner, Signer } from '@/src/store/signersSlice'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { setExecutionMethod } from '@/src/store/executionMethodSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import {
  walletConnectE2eState,
  WalletConnectE2eState,
} from '@/src/features/WalletConnect/context/walletConnectE2eState'
import {
  mockedActiveAccount,
  mockedActiveSafeInfo,
  pendingTxSafe1,
  pendingTxSafeInfo1,
  mockedPendingTxSignerAddress,
} from './mockData'
import { setupBaseConfig, setupSafe } from './setupHelpers'
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

// ---------------------------------------------------------------------------
// WalletConnectGate E2E tests
// ---------------------------------------------------------------------------

/**
 * Shared setup for WalletConnectGate tests.
 * Creates a pending-tx safe with a WC signer and configures the gate state.
 */
const setupWcGateBase = (dispatch: Dispatch, router: Router, wcOverrides: Partial<WalletConnectE2eState>) => {
  walletConnectE2eState.reset()
  setupBaseConfig(dispatch)

  // Add the signer as a WalletConnect type (not private-key)
  const wcSigner: Signer = {
    value: mockedPendingTxSignerAddress,
    name: 'WC Gate Signer',
    logoUri: null,
    type: 'walletconnect',
    walletName: WALLET_NAME,
    walletIcon: WALLET_ICON,
  }
  dispatch(addSigner(wcSigner))

  // Set up the pending tx safe and activate the WC signer
  setupSafe(dispatch, pendingTxSafe1, pendingTxSafeInfo1, 'WC Gate Test Safe')
  dispatch(setActiveSigner({ safeAddress: pendingTxSafe1.address, signer: wcSigner }))
  dispatch(setActiveSafe(pendingTxSafe1))

  // Force execution method to WITH_WC so relay doesn't override the gate
  dispatch(setExecutionMethod(ExecutionMethod.WITH_WC))

  // Configure the WC session / network state
  walletConnectE2eState.set(wcOverrides)

  router.replace('/pending-transactions')
}

/** Setup: WC signer with expired session → gate shows "Reconnect wallet to continue". */
export const setupWcGateReconnect = (dispatch: Dispatch, router: Router) => {
  // Post-reset defaults already model an expired WC session
  // (isConnected=false, address=undefined). No overrides needed.
  setupWcGateBase(dispatch, router, {})
}

/** Setup: WC signer connected on wrong network → gate shows "Switch network to continue". */
export const setupWcGateWrongNetwork = (dispatch: Dispatch, router: Router) => {
  setupWcGateBase(dispatch, router, {
    isConnected: true,
    address: mockedPendingTxSignerAddress,
    isWrongNetwork: true,
  })
}

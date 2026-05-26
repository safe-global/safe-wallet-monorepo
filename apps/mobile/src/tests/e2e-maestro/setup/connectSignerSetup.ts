import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { addSigner, Signer } from '@/src/store/signersSlice'
import { setExecutionMethod } from '@/src/store/executionMethodSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import {
  walletConnectE2eState,
  WalletConnectE2eState,
} from '@/src/features/WalletConnect/Signer/context/walletConnectE2eState'
import {
  mockedActiveAccount,
  mockedActiveSafeInfo,
  pendingTxSafe1,
  pendingTxSafeInfo1,
  mockedPendingTxSignerAddress,
} from './mockData'
import { resetReduxForE2E, setupPendingTxSafe } from './setupHelpers'
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
  resetReduxForE2E(dispatch)
  setWcState(OWNER_ADDRESS, true)
  onboardAndNavigate(dispatch, router)
}

/** Setup error path: onboard + configure WC mock to return a non-owner address. */
export const setupConnectSignerNonOwner = (dispatch: Dispatch, router: Router) => {
  resetReduxForE2E(dispatch)
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
  resetReduxForE2E(dispatch)

  const wcSigner: Signer = {
    value: mockedPendingTxSignerAddress,
    name: 'WC Gate Signer',
    logoUri: null,
    type: 'walletconnect',
    walletName: WALLET_NAME,
    walletIcon: WALLET_ICON,
  }

  setupPendingTxSafe(dispatch, pendingTxSafe1, pendingTxSafeInfo1, 'WC Gate Test Safe', mockedPendingTxSignerAddress, {
    signer: wcSigner,
  })

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

/**
 * Setup: WC signer present, but the next reconnect() will mismatch and route
 * to ReconnectError. Single-shot — the retry from ReconnectError clears the
 * flag and succeeds.
 */
export const setupWcGateReconnectWrongWallet = (dispatch: Dispatch, router: Router) => {
  setupWcGateBase(dispatch, router, { reconnectMismatch: true })
}

/**
 * Setup collision path: pre-seed a *private-key* signer at OWNER_ADDRESS,
 * then configure the WC mock to return that same address. When the user
 * triggers initiateConnection, the mock's collision branch (mirroring
 * useSignerCollisionGuard via the shared findCollidingSigner helper) fires
 * the native alert + clears the WC session.
 *
 * Same-type re-imports are intentionally NOT covered — findCollidingSigner
 * returns null for them (silent overwrite per production).
 */
export const setupConnectSignerCollision = (dispatch: Dispatch, router: Router) => {
  resetReduxForE2E(dispatch)
  setWcState(OWNER_ADDRESS, true)
  dispatch(
    addSigner({
      value: OWNER_ADDRESS,
      name: 'Pre-existing PK Signer',
      logoUri: null,
      type: 'private-key',
    }),
  )
  onboardAndNavigate(dispatch, router)
}

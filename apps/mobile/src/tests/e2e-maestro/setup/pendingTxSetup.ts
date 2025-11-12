import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { addSafe } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { addContact } from '@/src/store/addressBookSlice'
import {
  mockedPendingTxSignerAddress,
  pendingTxSafe1,
  pendingTxSafeInfo1,
  pendingTxSafe2,
  pendingTxSafeInfo2,
  pendingTxSafe3,
  pendingTxSafeInfo3,
  pendingTxSafe4,
  pendingTxSafeInfo4,
  pendingTxSafe5,
  pendingTxSafeInfo5,
  pendingTxSafe6,
  pendingTxSafeInfo6,
} from './mockData'
import { setupBaseConfig, setupSigner, setupPendingTxSafe } from './setupHelpers'

/**
 * Setup for e2ePendingTxs button
 * Creates all 6 pending transaction safes with shared signer
 * Navigates to home (user must navigate to pending txs screen)
 */
export const setupAllPendingTxSafes = (dispatch: Dispatch, router: Router) => {
  setupBaseConfig(dispatch)

  // Setup shared signer for all pending tx safes
  const mockedSigner = setupSigner(dispatch, mockedPendingTxSignerAddress)

  // Add all pending tx safes
  const pendingTxSafes = [
    { account: pendingTxSafe1, info: pendingTxSafeInfo1, name: 'Pending Tx Safe 1' },
    { account: pendingTxSafe2, info: pendingTxSafeInfo2, name: 'Pending Tx Safe 2' },
    { account: pendingTxSafe3, info: pendingTxSafeInfo3, name: 'Pending Tx Safe 3' },
    { account: pendingTxSafe4, info: pendingTxSafeInfo4, name: 'Pending Tx Safe 4' },
    { account: pendingTxSafe5, info: pendingTxSafeInfo5, name: 'Pending Tx Safe 5' },
    { account: pendingTxSafe6, info: pendingTxSafeInfo6, name: 'Pending Tx Safe 6' },
  ]

  for (const { account, info, name } of pendingTxSafes) {
    dispatch(
      addSafe({
        info: { [account.chainId]: info },
        address: account.address,
      }),
    )
    dispatch(
      addContact({
        value: account.address,
        name,
        chainIds: [account.chainId],
      }),
    )
    // Set the signer as active for each safe
    dispatch(
      setActiveSigner({
        safeAddress: account.address,
        signer: mockedSigner,
      }),
    )
  }

  // Set the first safe as active
  dispatch(setActiveSafe(pendingTxSafe1))

  router.replace('/(tabs)')
}

/**
 * Setup for e2ePendingTxsSafe1 button
 * Creates Pending Tx Safe 1 and navigates directly to pending transactions screen
 */
export const setupPendingTxsSafe1 = (dispatch: Dispatch, router: Router) => {
  setupPendingTxSafe(
    dispatch,
    pendingTxSafe1,
    pendingTxSafeInfo1,
    'Pending Tx Safe 1',
    mockedPendingTxSignerAddress,
  )
  router.replace('/pending-transactions')
}

/**
 * Setup for e2ePendingTxsSafe2 button
 * Creates Pending Tx Safe 2 and navigates directly to pending transactions screen
 */
export const setupPendingTxsSafe2 = (dispatch: Dispatch, router: Router) => {
  setupPendingTxSafe(
    dispatch,
    pendingTxSafe2,
    pendingTxSafeInfo2,
    'Pending Tx Safe 2',
    mockedPendingTxSignerAddress,
  )
  router.replace('/pending-transactions')
}

/**
 * Setup for e2ePendingTxsSafe3 button
 * Creates Pending Tx Safe 3 and navigates directly to pending transactions screen
 */
export const setupPendingTxsSafe3 = (dispatch: Dispatch, router: Router) => {
  setupPendingTxSafe(
    dispatch,
    pendingTxSafe3,
    pendingTxSafeInfo3,
    'Pending Tx Safe 3',
    mockedPendingTxSignerAddress,
  )
  router.replace('/pending-transactions')
}

/**
 * Setup for e2ePendingTxsSafe4 button
 * Creates Pending Tx Safe 4 and navigates directly to pending transactions screen
 */
export const setupPendingTxsSafe4 = (dispatch: Dispatch, router: Router) => {
  setupPendingTxSafe(
    dispatch,
    pendingTxSafe4,
    pendingTxSafeInfo4,
    'Pending Tx Safe 4',
    mockedPendingTxSignerAddress,
  )
  router.replace('/pending-transactions')
}


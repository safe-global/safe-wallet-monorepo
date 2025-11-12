import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import {
  mockedActiveAccount1,
  mockedActiveSafeInfo1,
  mockedTxHistoryAccount,
  mockedTxHistorySafeInfo,
  mockedSwapOrderAccount,
  mockedSwapOrderSafeInfo,
  mockedStakeDepositAccount,
  mockedStakeDepositSafeInfo,
} from './mockData'
import { setupBaseConfig, setupSafe } from './setupHelpers'

/**
 * Setup for e2eHistory button
 * Creates a simple history account and navigates to home
 */
export const setupHistory = (dispatch: Dispatch, router: Router) => {
  setupBaseConfig(dispatch)
  setupSafe(dispatch, mockedActiveAccount1, mockedActiveSafeInfo1, 'History Account')
  dispatch(setActiveSafe(mockedActiveAccount1))
  router.replace('/(tabs)')
}

/**
 * Setup for e2eTransactionHistory button
 * Creates comprehensive transaction history test data including:
 * - Main history safe
 * - Swap order test safe
 * - Stake deposit test safe
 * Navigates to home tabs
 */
export const setupTransactionHistory = (dispatch: Dispatch, router: Router) => {
  setupBaseConfig(dispatch)

  setupSafe(dispatch, mockedTxHistoryAccount, mockedTxHistorySafeInfo, 'History Safe')
  setupSafe(dispatch, mockedSwapOrderAccount, mockedSwapOrderSafeInfo, 'Swap Test Safe')
  setupSafe(dispatch, mockedStakeDepositAccount, mockedStakeDepositSafeInfo, 'Stake Deposit Safe')

  dispatch(setActiveSafe(mockedTxHistoryAccount))
  router.replace('/(tabs)')
}

/**
 * Setup for e2eTransactionHistoryDirect button
 * Same as setupTransactionHistory but navigates directly to transactions tab
 * Used for faster navigation in tests
 */
export const setupTransactionHistoryDirect = (dispatch: Dispatch, router: Router) => {
  setupBaseConfig(dispatch)

  setupSafe(dispatch, mockedTxHistoryAccount, mockedTxHistorySafeInfo, 'History Safe')
  setupSafe(dispatch, mockedSwapOrderAccount, mockedSwapOrderSafeInfo, 'Swap Test Safe')
  setupSafe(dispatch, mockedStakeDepositAccount, mockedStakeDepositSafeInfo, 'Stake Deposit Safe')

  dispatch(setActiveSafe(mockedTxHistoryAccount))
  router.replace('/(tabs)/transactions')
}


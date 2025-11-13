import type { Dispatch } from '@reduxjs/toolkit'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { SafeInfo } from '@/src/types/address'
import { updateSettings } from '@/src/store/settingsSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { addSafe } from '@/src/store/safesSlice'
import { addContact } from '@/src/store/addressBookSlice'
import { addSigner } from '@/src/store/signersSlice'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'

/**
 * Common setup: skip onboarding and disable notification prompts
 */
export const setupBaseConfig = (dispatch: Dispatch) => {
  dispatch(updateSettings({ onboardingVersionSeen: 'v1' }))
  dispatch(updatePromptAttempts(1))
}

/**
 * Setup a safe with contact entry in address book
 */
export const setupSafe = (dispatch: Dispatch, account: SafeInfo, info: SafeOverview, name: string) => {
  dispatch(addSafe({ info: { [account.chainId]: info }, address: account.address }))
  dispatch(addContact({ value: account.address, name, chainIds: [account.chainId] }))
}

/**
 * Setup a signer and add to address book
 */
export const setupSigner = (dispatch: Dispatch, signerAddress: string) => {
  const mockedSigner = {
    value: signerAddress,
    name: null,
    logoUri: null,
    type: 'private-key' as const,
  }

  dispatch(addSigner(mockedSigner))
  dispatch(
    addContact({
      value: signerAddress,
      name: `Signer-${signerAddress.slice(-4)}`,
      chainIds: [],
    }),
  )

  return mockedSigner
}

/**
 * Setup a pending transaction safe with signer
 * This is a complete setup that includes:
 * - Base config (onboarding, notifications)
 * - Signer setup
 * - Safe setup
 * - Active signer and safe
 */
export const setupPendingTxSafe = (
  dispatch: Dispatch,
  account: SafeInfo,
  info: SafeOverview,
  name: string,
  signerAddress: string,
) => {
  setupBaseConfig(dispatch)

  const mockedSigner = setupSigner(dispatch, signerAddress)

  setupSafe(dispatch, account, info, name)
  dispatch(setActiveSigner({ safeAddress: account.address, signer: mockedSigner }))
  dispatch(setActiveSafe(account))
}

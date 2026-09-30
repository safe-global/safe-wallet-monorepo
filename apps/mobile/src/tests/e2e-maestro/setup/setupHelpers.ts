import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { store } from '@/src/store'
import { Address, SafeInfo } from '@/src/types/address'
import { CONFIG_SERVICE_KEY } from '@/src/config/constants'
import { updateSettings } from '@/src/store/settingsSlice'
import { updatePromptAttempts } from '@/src/store/notificationsSlice'
import { addSafe } from '@/src/store/safesSlice'
import { addContact } from '@/src/store/addressBookSlice'
import { addSigner, Signer } from '@/src/store/signersSlice'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { resetE2EState } from '@/src/store/resetE2EState'
import { web3API } from '@/src/store/signersBalance'
import { walletConnectE2eState } from '@/src/features/WalletConnect/Signer/context/walletConnectE2eState'
import { walletKitE2eState } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'
import { draftEditorsE2eState } from './draftEditorsE2eState'
import { mockedActiveAccount, mockedActiveSafeInfo } from './mockData'

/**
 * Reset all e2e-relevant state (Redux slices + RTK Query caches +
 * walletConnectE2eState) to initial values. Setup helpers MUST call this
 * first so each Maestro test starts from a clean slate regardless of what
 * prior tests left behind.
 *
 * Test independence stops depending on `__suite__.yml` ordering as soon
 * as every helper does this.
 *
 * RTK Query caches are reset alongside reducer slices because slice
 * matchers (e.g. `safesSlice` listening to `safesGetOverviewForMany`)
 * would otherwise repopulate freshly-reset slices from stale cached data.
 *
 * Chains are re-initiated immediately after the reset because no component
 * on the pending-tx → review-and-execute path subscribes via
 * `useGetChainsConfigV2Query`. Without this re-fetch, `selectActiveChain`
 * returns `undefined` and `getExecutionMethod` falls back to WITH_PK,
 * which causes `WalletConnectGate` to render its children (Execute button)
 * instead of the WC gate even when an active WC signer is present.
 */
export const resetReduxForE2E = (dispatch: Dispatch) => {
  dispatch(resetE2EState())
  dispatch(cgwClient.util.resetApiState())
  dispatch(web3API.util.resetApiState())
  dispatch(hypernativeApi.util.resetApiState())
  walletConnectE2eState.reset()
  walletKitE2eState.reset()
  draftEditorsE2eState.reset()
  store.dispatch(
    apiSliceWithChainsConfig.endpoints.getChainsConfigV2.initiate(CONFIG_SERVICE_KEY, { forceRefetch: true }),
  )
}

/**
 * Common setup: skip onboarding and disable notification prompts
 */
export const setupBaseConfig = (dispatch: Dispatch) => {
  dispatch(updateSettings({ onboardingVersionSeen: 'v1' }))
  dispatch(updatePromptAttempts(1))
}

/** Onboard with the primary test Safe and navigate to the home tab. */
export const onboardAndNavigate = (dispatch: Dispatch, router: Router) => {
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
 *
 * By default registers a private-key signer for `signerAddress`.
 * Pass `options.signer` to register a pre-built signer (e.g. a WalletConnect
 * signer) instead.
 */
export const setupPendingTxSafe = (
  dispatch: Dispatch,
  account: SafeInfo,
  info: SafeOverview,
  name: string,
  signerAddress: string,
  options: { signer?: Signer } = {},
) => {
  setupBaseConfig(dispatch)

  let signer: Signer
  if (options.signer) {
    signer = options.signer
    dispatch(addSigner(signer))
  } else {
    signer = setupSigner(dispatch, signerAddress)
  }

  setupSafe(dispatch, account, info, name)
  dispatch(setActiveSigner({ safeAddress: account.address, signer }))
  dispatch(setActiveSafe(account))
}

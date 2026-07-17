/**
 * Setups for the draft-editor flows (nonce editor / approval editor). Both
 * editors only render for DRAFT transactions, so the approval flow composes a
 * swap-shaped multiSend draft (ERC-20 approve + follow-up call) directly and
 * opens the confirm screen — queued gateway txs never show the editors.
 */
import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import { cgwApi as safesApi } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { store } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { composeSafeTxDraft } from '@/src/features/WalletConnect/Wallet/services/composeSafeTxDraft'
import { draftEditorsE2eState } from './draftEditorsE2eState'
import { mockedActiveAccount } from './mockData'
import { onboardAndNavigate, resetReduxForE2E, setupSigner } from './setupHelpers'

// Owner of the primary test Safe; seeding it as active signer unlocks the send flow.
const E2E_OWNER_ADDRESS = '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472'

// COW on Sepolia — the primary test Safe holds a balance, so useApprovalInfos
// resolves token metadata from balances without RPC fallbacks.
const COW_TOKEN_ADDRESS = '0x0625aFB445C3B6B7B929342a04A22599fd5dBB59'
const SPENDER_ADDRESS = '0x81BdB0a66065363F704A105D67D53d090aD14fec'

// approve(spender, 1.5e18)
const APPROVE_DATA =
  '0x095ea7b3' +
  '00000000000000000000000081bdb0a66065363f704a105d67d53d090ad14fec' +
  '00000000000000000000000000000000000000000000000014d1120d7b160000'

const POLL_INTERVAL_MS = 500
const POLL_ATTEMPTS = 40

const waitFor = async <T>(label: string, read: () => T | undefined | null): Promise<T> => {
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    const value = read()
    if (value) {
      return value
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  throw new Error(`E2E draft setup timed out waiting for ${label}`)
}

/** Onboard the primary Safe with an owner signer and land on home (send flow entry). */
export const setupSendFlow = (dispatch: Dispatch, router: Router) => {
  resetReduxForE2E(dispatch)
  const signer = setupSigner(dispatch, E2E_OWNER_ADDRESS)
  dispatch(setActiveSigner({ safeAddress: mockedActiveAccount.address, signer }))
  onboardAndNavigate(dispatch, router)
}

/**
 * Compose a multiSend draft with an ERC-20 approval and open the confirm screen.
 * Waits for the chain config and Safe SDK (initialized asynchronously after the
 * active Safe is set) before composing; the outcome is surfaced as a marker.
 */
export const setupApprovalDraft = async (dispatch: Dispatch, router: Router) => {
  setupSendFlow(dispatch, router)
  const { address: safeAddress, chainId } = mockedActiveAccount
  try {
    // store.dispatch (not the passed dispatch) for the typed AppDispatch these need.
    const chain = await waitFor('chain config', () => selectChainById(store.getState(), chainId))
    await waitFor('Safe SDK', () => getSafeSDK())
    const safe = await store.dispatch(safesApi.endpoints.safesGetSafeV1.initiate({ chainId, safeAddress })).unwrap()
    const txId = await composeSafeTxDraft({
      calls: [
        { to: COW_TOKEN_ADDRESS, value: '0x0', data: APPROVE_DATA },
        { to: SPENDER_ADDRESS, value: '0x0', data: '0x' },
      ],
      chainId,
      safeAddress,
      safe,
      chain,
      dispatch: store.dispatch,
    })
    router.push({ pathname: '/confirm-transaction', params: { txId } })
    draftEditorsE2eState.set({ setupStatus: 'ready' })
  } catch (e) {
    draftEditorsE2eState.set({ setupStatus: 'failed' })
    throw e
  }
}

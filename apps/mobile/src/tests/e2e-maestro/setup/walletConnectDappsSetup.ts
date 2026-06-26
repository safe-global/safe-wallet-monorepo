import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import type { WalletKitTypes } from '@reown/walletkit'
import { getEip155ChainId } from '@safe-global/utils/features/walletconnect/utils'
import { store } from '@/src/store'
import { pushPending, removeSession } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import {
  walletKitE2eState,
  E2E_SESSION_TOPIC,
  E2E_PAIRING_TOPIC,
} from '@/src/features/WalletConnect/Wallet/walletKitE2eState'
import { mockedActiveAccount, TEST_WALLET_ICON } from './mockData'
import { onboardAndNavigate, resetReduxForE2E } from './setupHelpers'

// ── Fixtures ───────────────────────────────────────────────────────────────
// Pinned to the active test Safe's chain so the proposal is approvable. The
// approved-session fixture lives in walletKit.e2e.ts, next to the fake.

const CAIP2 = getEip155ChainId(mockedActiveAccount.chainId) // 'eip155:11155111'

/** Uniswap-shaped dApp metadata. */
const DAPP_METADATA = {
  name: 'Uniswap',
  description: 'Swap or provide liquidity on the Uniswap Protocol',
  url: 'https://app.uniswap.org',
  icons: [TEST_WALLET_ICON],
}

type VerifiedFixture = {
  validation: 'VALID' | 'INVALID' | 'UNKNOWN'
  isScam?: boolean
}

// Deterministic ids; reset per flow in setupWcDappsBase so they're stable across runs.
const PROPOSAL_SEQ_START = 1000
let proposalSeq = PROPOSAL_SEQ_START

/** Build a session proposal whose namespaces are approvable for the active Safe. */
const buildProposal = (verified: VerifiedFixture): WalletKitTypes.SessionProposal => {
  const id = ++proposalSeq
  return {
    id,
    params: {
      id,
      pairingTopic: E2E_PAIRING_TOPIC,
      expiryTimestamp: 0,
      requiredNamespaces: {},
      optionalNamespaces: {
        eip155: {
          chains: [CAIP2],
          methods: ['eth_sendTransaction', 'wallet_sendCalls'],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
      relays: [{ protocol: 'irn' }],
      proposer: { publicKey: 'e2e-proposer-pubkey', metadata: DAPP_METADATA },
    },
    verifyContext: {
      verified: {
        verifyUrl: '',
        validation: verified.validation,
        origin: DAPP_METADATA.url,
        // Only present for the scam fixture; real non-scam proposals omit it.
        ...(verified.isScam ? { isScam: true } : {}),
      },
    },
  }
}

// ── Setup + synthesis (driven by TestCtrls buttons) ──────────────────────────

/**
 * Base setup for every WalletConnect dApp flow: reset, force-enable the feature,
 * and land on the home tab. (The fake approveSession() returns APPROVED_SESSION.)
 */
export const setupWcDappsBase = (dispatch: Dispatch, router: Router) => {
  resetReduxForE2E(dispatch)
  proposalSeq = PROPOSAL_SEQ_START
  walletKitE2eState.set({ forceNativeWalletConnect: true })
  onboardAndNavigate(dispatch, router)
}

const synthProposal = (verified: VerifiedFixture) => {
  const proposal = buildProposal(verified)
  store.dispatch(pushPending({ kind: 'proposal', id: proposal.id, proposal }))
}

/** Synthesise a session_proposal from a VALID, verified dApp. */
export const synthSessionProposalValid = () => synthProposal({ validation: 'VALID' })

/** Synthesise a session_proposal whose verify status is UNKNOWN (unverified → red banner). */
export const synthSessionProposalUnverified = () => synthProposal({ validation: 'UNKNOWN' })

/** Synthesise a scam-flagged session_proposal. */
export const synthSessionProposalScam = () => synthProposal({ validation: 'VALID', isScam: true })

/** Synthesise a session_delete for the fixture session topic (slice + fake's session store). */
export const synthSessionDelete = () => {
  store.dispatch(removeSession(E2E_SESSION_TOPIC))
  const { [E2E_SESSION_TOPIC]: _removed, ...rest } = walletKitE2eState.get().sessions
  walletKitE2eState.set({ sessions: rest })
}

/** Arm the fake pair() to hang so the scanner's 10s timeout overlay fires. */
export const setWcPairHang = () => walletKitE2eState.set({ pairBehavior: 'hang' })

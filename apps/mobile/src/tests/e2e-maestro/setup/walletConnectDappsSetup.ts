import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import type { SessionTypes } from '@walletconnect/types'
import type { WalletKitTypes } from '@reown/walletkit'
import { getEip155ChainId } from '@safe-global/utils/features/walletconnect/utils'
import { store } from '@/src/store'
import { pushPending, removeSession } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { walletKitE2eState } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'
import { SAFE_WALLET_METADATA } from '@/src/features/WalletConnect/shared/metadata'
import { mockedActiveAccount, mockedActiveSafeInfo, TEST_WALLET_ICON } from './mockData'
import { onboardAndNavigate, resetReduxForE2E } from './setupHelpers'

// ── Fixtures ───────────────────────────────────────────────────────────────
// The dApp surface (header QR, controller) is gated by NATIVE_WALLETCONNECT and
// approval is built from the active Safe's deployments, so these fixtures pin to
// the same Sepolia Safe the other e2e setups use.

const CHAIN_ID = mockedActiveAccount.chainId // '11155111'
const CAIP2 = getEip155ChainId(CHAIN_ID) // 'eip155:11155111'
const SAFE_ADDRESS = mockedActiveSafeInfo.address.value

const PAIRING_TOPIC = 'e2e-pairing-topic'
const SESSION_TOPIC = 'e2e-session-topic'

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

// Counter (not Date/random) keeps proposal ids deterministic and unique per synth.
let proposalSeq = 1000

/** Build a relay-shaped session proposal whose namespaces are approvable for the active Safe. */
const buildProposal = (verified: VerifiedFixture): WalletKitTypes.SessionProposal => {
  const id = ++proposalSeq
  return {
    id,
    params: {
      id,
      pairingTopic: PAIRING_TOPIC,
      expiryTimestamp: 0,
      // No hard requirements; the optional eip155 namespace intersects with the Safe's chain.
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
        isScam: verified.isScam,
      },
    },
  } as WalletKitTypes.SessionProposal
}

/** Fixture session the fake approveSession() returns / addSession mirrors into the slice. */
export const APPROVED_SESSION: SessionTypes.Struct = {
  topic: SESSION_TOPIC,
  pairingTopic: PAIRING_TOPIC,
  relay: { protocol: 'irn' },
  expiry: 0,
  acknowledged: true,
  controller: 'self',
  namespaces: {
    eip155: {
      chains: [CAIP2],
      accounts: [`${CAIP2}:${SAFE_ADDRESS}`],
      methods: ['eth_sendTransaction', 'wallet_sendCalls'],
      events: ['chainChanged', 'accountsChanged'],
    },
  },
  requiredNamespaces: {},
  optionalNamespaces: {},
  self: { publicKey: 'self', metadata: SAFE_WALLET_METADATA },
  peer: { publicKey: 'e2e-proposer-pubkey', metadata: DAPP_METADATA },
} as SessionTypes.Struct

// ── Setup + synthesis (driven by TestCtrls buttons) ──────────────────────────

/**
 * Base setup for every WalletConnect dApp flow: reset, force-enable the feature,
 * and land on the home tab. (The fake approveSession() returns APPROVED_SESSION.)
 */
export const setupWcDappsBase = (dispatch: Dispatch, router: Router) => {
  resetReduxForE2E(dispatch)
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
  store.dispatch(removeSession(SESSION_TOPIC))
  const { [SESSION_TOPIC]: _removed, ...rest } = walletKitE2eState.get().sessions
  walletKitE2eState.set({ sessions: rest })
}

/** Arm the fake pair() to hang so the scanner's 10s timeout overlay fires. */
export const setWcPairHang = () => walletKitE2eState.set({ pairBehavior: 'hang' })

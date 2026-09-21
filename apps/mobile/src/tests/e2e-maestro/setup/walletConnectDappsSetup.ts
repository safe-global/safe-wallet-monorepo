import type { Dispatch } from '@reduxjs/toolkit'
import type { Router } from 'expo-router'
import type { WalletKitTypes } from '@reown/walletkit'
import { getEip155ChainId } from '@safe-global/utils/features/walletconnect/utils'
import { store } from '@/src/store'
import { setActiveSigner } from '@/src/store/activeSignerSlice'
import { setBiometricsEnabled } from '@/src/store/biometricsSlice'
import { keyStorageService } from '@/src/services/key-storage'
import {
  addSession,
  pushPending,
  removeSession,
  sessionRequestReceived,
} from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { APPROVED_SESSION } from '@/src/features/WalletConnect/Wallet/walletKit.e2e'
import {
  walletKitE2eState,
  E2E_SESSION_TOPIC,
  E2E_PAIRING_TOPIC,
} from '@/src/features/WalletConnect/Wallet/walletKitE2eState'
import { mockedActiveAccount, TEST_WALLET_ICON } from './mockData'
import { onboardAndNavigate, resetReduxForE2E, setupSigner } from './setupHelpers'

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

const REQUEST_SEQ_START = 5000
let requestSeq = REQUEST_SEQ_START

// Owner of the primary test Safe, so staging CGW accepts the /propose signature.
// INTENTIONALLY PUBLIC throwaway key (already committed in the onboarding flows); never fund it.
export const E2E_TX_OWNER_ADDRESS = '0x3336745b7EA628F5134Bd9d08aa68b4979fA3472'
const E2E_TX_OWNER_PRIVATE_KEY = '0xffc4b004b8746a7ce547ffa644686ca660efcf7a5a39910c714f922d7ad9bcc8'

// 0.001 / 0.002 ETH; proposing needs no balance (nothing executes).
const E2E_TX_VALUE = 0x38d7ea4c68000n
const E2E_BATCH_VALUE_2 = 0x71afd498d0000n

// The Safe's on-chain nonce never advances (nothing executes), so identical calldata
// would reproduce an already-signed safeTxHash on reruns and skip the sign tail.
// Non-zero wei jitter (invisible at display precision) keeps every composed tx unique.
let jitterSeq = 0
const jitteredValue = (base: bigint): string =>
  `0x${(base + BigInt(((Date.now() + ++jitterSeq) % 0xffffff) + 1)).toString(16)}`

const buildTxCall = () => ({
  from: mockedActiveAccount.address,
  to: '0x81BdB0a66065363F704A105D67D53d090aD14fec',
  value: jitteredValue(E2E_TX_VALUE),
  data: '0x',
})

// EIP-5792 bundle; 0xaa36a7 = Sepolia (11155111).
const buildBatchBundle = () => ({
  version: '1.0',
  chainId: '0xaa36a7',
  from: mockedActiveAccount.address,
  atomicRequired: true,
  calls: [
    { to: '0x81BdB0a66065363F704A105D67D53d090aD14fec', value: jitteredValue(E2E_TX_VALUE), data: '0x' },
    { to: '0x4d5CF9E6df9a95F4c1F5398706cA27218add5949', value: jitteredValue(E2E_BATCH_VALUE_2), data: '0x' },
  ],
})

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
  requestSeq = REQUEST_SEQ_START
  walletKitE2eState.set({ forceNativeWalletConnect: true })
  onboardAndNavigate(dispatch, router)
}

/**
 * Tx-request setup: base + seeded session + an owner signer with its key in the
 * simulator keychain (un-gated, so no biometric prompt), biometrics-enabled so
 * the confirm flow signs without the opt-in detour.
 */
export const setupWcDappsTx = async (dispatch: Dispatch, router: Router) => {
  setupWcDappsBase(dispatch, router)
  seedWcSession()
  const signer = setupSigner(dispatch, E2E_TX_OWNER_ADDRESS)
  dispatch(setActiveSigner({ safeAddress: mockedActiveAccount.address, signer }))
  dispatch(setBiometricsEnabled(true))
  // The keychain write can fail on a simulator; flows gate on the resulting marker.
  try {
    await keyStorageService.storePrivateKey(E2E_TX_OWNER_ADDRESS, E2E_TX_OWNER_PRIVATE_KEY, {
      requireAuthentication: false,
    })
    walletKitE2eState.set({ txSetupStatus: 'ready' })
  } catch (e) {
    walletKitE2eState.set({ txSetupStatus: 'failed' })
    throw e
  }
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

/** Seed one approved session (slice + fake's session store) so management flows skip pairing. */
export const seedWcSession = () => {
  store.dispatch(addSession({ session: APPROVED_SESSION, verifyVariant: 'verified' }))
  walletKitE2eState.set({
    sessions: { ...walletKitE2eState.get().sessions, [APPROVED_SESSION.topic]: APPROVED_SESSION },
  })
}

/** Synthesise a session_delete for the fixture session topic (slice + fake's session store). */
export const synthSessionDelete = () => {
  store.dispatch(removeSession(E2E_SESSION_TOPIC))
  const { [E2E_SESSION_TOPIC]: _removed, ...rest } = walletKitE2eState.get().sessions
  walletKitE2eState.set({ sessions: rest })
}

/** Arm the fake pair() to hang so the scanner's 10s timeout overlay fires. */
export const setWcPairHang = () => walletKitE2eState.set({ pairBehavior: 'hang' })

// ── Transaction requests ─────────────────────────────────────────────────────

// Dispatched through sessionRequestReceived (not pushed straight into the pending
// queue) so the real router runs — read-only 4100 rejection, chain/params validation.
const buildTxRequest = (
  method: 'eth_sendTransaction' | 'wallet_sendCalls',
  params: unknown[],
): WalletKitTypes.SessionRequest => ({
  id: ++requestSeq,
  topic: E2E_SESSION_TOPIC,
  params: { request: { method, params }, chainId: CAIP2 },
  verifyContext: {
    verified: { verifyUrl: '', validation: 'VALID', origin: DAPP_METADATA.url },
  },
})

/** Synthesise an eth_sendTransaction from the seeded dApp session. */
export const synthTxRequest = () =>
  store.dispatch(sessionRequestReceived(buildTxRequest('eth_sendTransaction', [buildTxCall()])))

/** Synthesise a wallet_sendCalls (EIP-5792) batch of two calls. */
export const synthTxBatch = () =>
  store.dispatch(sessionRequestReceived(buildTxRequest('wallet_sendCalls', [buildBatchBundle()])))

/** Arm the e2e fetch interceptor to 500 the next CGW /propose (reset() restores 'live'). */
export const armProposeFailure = () => walletKitE2eState.set({ proposeBehavior: 'fail500' })

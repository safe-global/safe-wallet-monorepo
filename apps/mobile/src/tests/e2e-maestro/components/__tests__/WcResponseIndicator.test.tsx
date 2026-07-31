import React from 'react'
import { act } from '@testing-library/react-native'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { setOutstandingRequest } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { walletKitE2eState } from '@/src/features/WalletConnect/Wallet/walletKitE2eState'
import { WcResponseIndicator } from '../WcResponseIndicator'

const SAFE_TX_HASH = '0x1111111111111111111111111111111111111111111111111111111111111111'

const handOff = (store: ReturnType<typeof createTestStore>, method: 'eth_sendTransaction' | 'wallet_sendCalls') =>
  act(() => {
    store.dispatch(
      setOutstandingRequest({
        safeTxHash: SAFE_TX_HASH,
        topic: 'e2e-session-topic',
        id: 1,
        method,
        chainId: '11155111',
        safeAddress: '0x2f3e600a3F38b66aDcbe6530B191F2BE55c2Fbb6',
      }),
    )
  })

const respond = (response: { result?: unknown; error?: { code: number; message: string } }) =>
  act(() => {
    walletKitE2eState.set({ lastRequestResponse: { topic: 'e2e-session-topic', id: 1, ...response } })
  })

describe('WcResponseIndicator', () => {
  beforeEach(() => {
    walletKitE2eState.reset()
  })

  it('renders no markers before a response is delivered', () => {
    const store = createTestStore()
    const { queryByTestId } = renderWithStore(<WcResponseIndicator />, store)
    expect(queryByTestId(/e2e-wc-response/)).toBeNull()
  })

  it('surfaces a delivered error code as a marker', () => {
    const store = createTestStore()
    const { getByTestId } = renderWithStore(<WcResponseIndicator />, store)
    respond({ error: { code: 4100, message: 'No signer attached to this Safe' } })
    expect(getByTestId('e2e-wc-response-error-4100')).toBeTruthy()
  })

  it('renders hash-match when the bare result equals the handed-off safeTxHash', () => {
    const store = createTestStore()
    const { getByTestId, queryByTestId } = renderWithStore(<WcResponseIndicator />, store)
    handOff(store, 'eth_sendTransaction')
    respond({ result: SAFE_TX_HASH })
    expect(getByTestId('e2e-wc-response-hash-match')).toBeTruthy()
    expect(queryByTestId('e2e-wc-response-5792-match')).toBeNull()
  })

  it('renders 5792-match only for the exact { id: safeTxHash } envelope', () => {
    const store = createTestStore()
    const { getByTestId, queryByTestId } = renderWithStore(<WcResponseIndicator />, store)
    handOff(store, 'wallet_sendCalls')
    respond({ result: { id: SAFE_TX_HASH } })
    expect(getByTestId('e2e-wc-response-5792-match')).toBeTruthy()
    expect(queryByTestId('e2e-wc-response-hash-match')).toBeNull()
  })

  it('rejects an envelope with extra keys', () => {
    const store = createTestStore()
    const { queryByTestId } = renderWithStore(<WcResponseIndicator />, store)
    handOff(store, 'wallet_sendCalls')
    respond({ result: { id: SAFE_TX_HASH, capabilities: {} } })
    expect(queryByTestId('e2e-wc-response-5792-match')).toBeNull()
  })

  it('does not render a match for a result that differs from the handed-off hash', () => {
    const store = createTestStore()
    const { queryByTestId } = renderWithStore(<WcResponseIndicator />, store)
    handOff(store, 'eth_sendTransaction')
    respond({ result: '0xsomethingelse' })
    expect(queryByTestId('e2e-wc-response-hash-match')).toBeNull()
    expect(queryByTestId('e2e-wc-response-5792-match')).toBeNull()
  })
})

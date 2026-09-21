import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { SendTransactionSheet } from '../SendTransactionSheet'
import { walletKitSliceName, type PendingSessionRequest } from '../../store/walletKitSlice'

const makePending = (overrides: Partial<PendingSessionRequest> = {}): PendingSessionRequest => ({
  kind: 'request',
  id: 1,
  topic: 'topic',
  chainId: 'eip155:1',
  method: 'eth_sendTransaction',
  params: [{ to: '0xabc', value: '0x0', data: '0x' }],
  verifyContext: { verified: { validation: 'VALID' } } as PendingSessionRequest['verifyContext'],
  ...overrides,
})

// Seed a mirrored session so the sheet can resolve the dApp's peer metadata by topic.
const storeWith = (metadata: Record<string, unknown>) =>
  createTestStore({
    [walletKitSliceName]: {
      sessions: { topic: { peer: { metadata } } },
      pending: [],
      outstandingRequests: {},
    },
  } as never)

describe('SendTransactionSheet', () => {
  it('renders the identity-only "Transaction request" gate with name and domain', () => {
    const store = storeWith({ name: 'Uniswap', url: 'https://uniswap.org/', icons: ['https://x/icon.png'] })
    const { getByText } = renderWithStore(<SendTransactionSheet pending={makePending()} />, store)
    expect(getByText('Transaction request')).toBeTruthy()
    expect(getByText('Uniswap')).toBeTruthy()
    expect(getByText('uniswap.org')).toBeTruthy()
  })

  it('shows only the host for a metadata URL with path and query', () => {
    const store = storeWith({ name: 'Uniswap', url: 'https://app.uniswap.org/swap?chain=1', icons: [] })
    const { getByText, queryByText } = renderWithStore(<SendTransactionSheet pending={makePending()} />, store)
    expect(getByText('app.uniswap.org')).toBeTruthy()
    expect(queryByText(/swap\?chain=1/)).toBeNull()
  })

  it('hides the domain pill when the dApp provides no URL', () => {
    const store = storeWith({ name: 'Uniswap', icons: [] })
    const { getByText, queryByTestId } = renderWithStore(<SendTransactionSheet pending={makePending()} />, store)
    expect(getByText('Uniswap')).toBeTruthy()
    expect(queryByTestId('wc-tx-domain')).toBeNull()
  })

  it('asks the host to open the permissions panel when the domain pill is pressed', () => {
    const onOpenPermissions = jest.fn()
    const store = storeWith({ name: 'Uniswap', url: 'https://uniswap.org/', icons: [] })
    const { getByTestId } = renderWithStore(
      <SendTransactionSheet pending={makePending()} onOpenPermissions={onOpenPermissions} />,
      store,
    )
    fireEvent.press(getByTestId('wc-tx-domain'))
    expect(onOpenPermissions).toHaveBeenCalledTimes(1)
  })
})

import React from 'react'
import { getAddress } from 'ethers'
import { faker } from '@faker-js/faker'
import { fireEvent, waitFor } from '@testing-library/react-native'
import type { IWalletKit, WalletKitTypes } from '@reown/walletkit'
import { renderWithStore, createTestStore } from '@/src/tests/test-utils'
import { SessionProposalSheet } from '../SessionProposalSheet'
import { selectSessions, selectPending } from '../../store/walletKitSlice'
import type { RootState } from '@/src/store'

const mockShow = jest.fn()
jest.mock('@tamagui/toast', () => ({ useToastController: () => ({ show: mockShow }) }))

const safeAddress = getAddress(faker.finance.ethereumAddress()) as `0x${string}`

const makePending = (): { id: number; proposal: WalletKitTypes.SessionProposal } => ({
  id: 123,
  proposal: {
    id: 123,
    params: {
      proposer: { metadata: { name: 'Uniswap', url: 'https://uniswap.org/', icons: ['https://x/icon.png'] } },
      requiredNamespaces: { eip155: { chains: ['eip155:1'], methods: [], events: [] } },
      optionalNamespaces: {},
    },
    verifyContext: { verified: { validation: 'VALID' } },
  } as unknown as WalletKitTypes.SessionProposal,
})

const makeStore = () =>
  createTestStore({
    activeSafe: { address: safeAddress, chainId: '1' },
    safes: { [safeAddress]: { '1': {} } } as never,
  })

const makeWalletKit = (approveImpl?: () => Promise<unknown>) => {
  const session = { topic: 'topic-1', namespaces: {} }
  return {
    approveSession: jest.fn(approveImpl ?? (() => Promise.resolve(session))),
    rejectSession: jest.fn().mockResolvedValue(undefined),
  } as unknown as IWalletKit & { approveSession: jest.Mock; rejectSession: jest.Mock }
}

describe('SessionProposalSheet', () => {
  beforeEach(() => mockShow.mockClear())

  it('renders dApp name and domain', () => {
    const { getByText } = renderWithStore(
      <SessionProposalSheet walletKit={makeWalletKit()} pending={makePending()} />,
      makeStore(),
    )
    expect(getByText('Uniswap')).toBeTruthy()
    expect(getByText('uniswap.org')).toBeTruthy()
  })

  it('opens the permissions panel from the domain pill and signals the host to grow the sheet', () => {
    const onPermissionsOpenChange = jest.fn()
    const { getByTestId, getByText } = renderWithStore(
      <SessionProposalSheet
        walletKit={makeWalletKit()}
        pending={makePending()}
        onPermissionsOpenChange={onPermissionsOpenChange}
      />,
      makeStore(),
    )
    fireEvent.press(getByTestId('wc-proposal-domain'))
    expect(getByText('This domain has been verified.')).toBeTruthy()
    expect(onPermissionsOpenChange).toHaveBeenLastCalledWith(true)
  })

  it('signals the host to shrink the sheet when the permissions panel is dismissed', () => {
    const onPermissionsOpenChange = jest.fn()
    const { getByTestId } = renderWithStore(
      <SessionProposalSheet
        walletKit={makeWalletKit()}
        pending={makePending()}
        onPermissionsOpenChange={onPermissionsOpenChange}
      />,
      makeStore(),
    )
    fireEvent.press(getByTestId('wc-proposal-domain'))
    fireEvent.press(getByTestId('wc-proposal-permissions-dismiss'))
    expect(onPermissionsOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('approves the session and adds it to the slice on Connect', async () => {
    const wk = makeWalletKit()
    const store = makeStore()
    const { getByTestId } = renderWithStore(<SessionProposalSheet walletKit={wk} pending={makePending()} />, store)
    fireEvent.press(getByTestId('wc-proposal-connect'))
    await waitFor(() => expect(wk.approveSession).toHaveBeenCalledTimes(1))
    const arg = wk.approveSession.mock.calls[0][0]
    expect(arg.id).toBe(123)
    expect(arg.namespaces.eip155.accounts).toEqual(['eip155:1:' + safeAddress])
    expect(arg.sessionProperties).toBeDefined()
    await waitFor(() => expect(selectSessions(store.getState() as RootState)).toHaveLength(1))
    expect(selectPending(store.getState() as RootState)).toHaveLength(0)
  })

  it('shows a toast and rejects when approveSession fails', async () => {
    const wk = makeWalletKit(() => Promise.reject(new Error('boom')))
    const { getByTestId } = renderWithStore(
      <SessionProposalSheet walletKit={wk} pending={makePending()} />,
      makeStore(),
    )
    fireEvent.press(getByTestId('wc-proposal-connect'))
    await waitFor(() => expect(mockShow).toHaveBeenCalledWith('boom', expect.anything()))
    expect(wk.rejectSession).toHaveBeenCalledWith({ id: 123, reason: expect.anything() })
  })
})

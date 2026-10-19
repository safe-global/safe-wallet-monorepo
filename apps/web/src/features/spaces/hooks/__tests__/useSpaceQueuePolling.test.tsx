import { faker } from '@faker-js/faker'
import { renderHook, act } from '@testing-library/react'
import { type ReactNode } from 'react'
import { Provider } from 'react-redux'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionListItemType, TransactionStatus } from '@safe-global/store/gateway/types'
import { skipToken } from '@reduxjs/toolkit/query'
import { POLLING_INTERVAL } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { makeStore } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { PendingStatus, setPendingTx } from '@/store/pendingTxsSlice'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { useSpaceQueuePolling } from '../useSpaceQueuePolling'

const mockSpaceId = jest.fn<string | null, []>()
const mockIsActiveMember = jest.fn<boolean, []>()
const mockHasFeature = jest.fn<boolean | undefined, []>()
const mockWalletAddress = jest.fn<string | undefined, []>()
const mockIsAuthenticated = jest.fn<boolean, []>()

jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => mockSpaceId() }))
jest.mock('../useSpaceMembers', () => ({ useIsActiveMember: () => mockIsActiveMember() }))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: () => mockHasFeature() }))
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => {
    const address = mockWalletAddress()
    return address ? { address } : null
  },
}))
jest.mock('@/store/authSlice', () => ({
  ...jest.requireActual('@/store/authSlice'),
  isAuthenticated: () => mockIsAuthenticated(),
}))

const spaceId = faker.string.uuid()
const chainId = '1'
const safeAddress = faker.finance.ethereumAddress()
const wallet = faker.finance.ethereumAddress()
const refetch = jest.fn()

const queuedTx = (missingSigners: string[], txStatus = TransactionStatus.AWAITING_CONFIRMATIONS) => {
  const item: TransactionQueuedItem = {
    type: TransactionListItemType.TRANSACTION,
    conflictType: 'None',
    transaction: safeTxSummaryBuilder()
      .with({
        id: `multisig_${safeAddress}_${faker.string.hexadecimal({ length: 64 })}`,
        txStatus,
        executionInfo: executionInfoBuilder()
          .with({ missingSigners: missingSigners.map((value) => ({ value })) })
          .build(),
      })
      .build(),
  }
  return item
}

const page = (items: TransactionQueuedItem[]): SpaceQueuedItemPage => ({
  next: null,
  previous: null,
  results: [{ chainId, safeAddress, items }],
  unavailableSafes: [],
})

let queueSpy: jest.SpyInstance
const mockQueue = (currentData: SpaceQueuedItemPage | undefined) => {
  queueSpy = jest.spyOn(spacesQueries, 'useSpaceTransactionsGetTransactionQueueV1Query').mockReturnValue({
    currentData,
    refetch,
  } as unknown as ReturnType<typeof spacesQueries.useSpaceTransactionsGetTransactionQueueV1Query>)
}

const renderPolling = (store = makeStore()) => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  const utils = renderHook(() => useSpaceQueuePolling(), { wrapper })
  return { store, ...utils }
}

const messages = (store: ReturnType<typeof makeStore>) => selectNotifications(store.getState()).map((n) => n.message)

describe('useSpaceQueuePolling', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    refetch.mockClear()
    mockSpaceId.mockReturnValue(spaceId)
    mockIsActiveMember.mockReturnValue(true)
    mockHasFeature.mockReturnValue(true)
    mockWalletAddress.mockReturnValue(wallet)
    mockIsAuthenticated.mockReturnValue(true)
    mockQueue(undefined)
  })

  it('should poll the first queue page of the Space', () => {
    renderPolling()

    expect(queueSpy).toHaveBeenLastCalledWith(
      { spaceId },
      { pollingInterval: POLLING_INTERVAL, skipPollingIfUnfocused: true },
    )
  })

  it.each([
    ['there is no Space', () => mockSpaceId.mockReturnValue(null)],
    ['the flag is off', () => mockHasFeature.mockReturnValue(false)],
    ['the user is not an active member', () => mockIsActiveMember.mockReturnValue(false)],
    ['the user is signed out', () => mockIsAuthenticated.mockReturnValue(false)],
  ])('should skip the query when %s', (_, arrange) => {
    arrange()

    renderPolling()

    expect(queueSpy).toHaveBeenLastCalledWith(skipToken, expect.anything())
  })

  it.each([
    [TxEvent.PROPOSED, () => txDispatch(TxEvent.PROPOSED, { txId: 'tx', nonce: 1, chainId, safeAddress })],
    [
      TxEvent.SIGNATURE_PROPOSED,
      () =>
        txDispatch(TxEvent.SIGNATURE_PROPOSED, { txId: 'tx', nonce: 1, chainId, safeAddress, signerAddress: wallet }),
    ],
    [TxEvent.PROCESSED, () => txDispatch(TxEvent.PROCESSED, { txId: 'tx', nonce: 1, chainId, safeAddress })],
    [TxEvent.SUCCESS, () => txDispatch(TxEvent.SUCCESS, { txId: 'tx', nonce: 1, chainId, safeAddress })],
    [TxEvent.DELETED, () => txDispatch(TxEvent.DELETED, { safeTxHash: '0x' })],
  ])('should refetch on %s', (_, dispatchEvent) => {
    renderPolling()

    act(() => dispatchEvent())

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should not refetch on TxEvents while inactive', () => {
    mockHasFeature.mockReturnValue(false)
    renderPolling()

    act(() => {
      txDispatch(TxEvent.PROPOSED, { txId: 'tx', nonce: 1, chainId, safeAddress })
    })

    expect(refetch).not.toHaveBeenCalled()
  })

  it('should toast once for a new tx the wallet can sign', () => {
    mockQueue(page([queuedTx([wallet])]))
    const { store, rerender } = renderPolling()

    rerender()

    expect(messages(store)).toEqual(['A transaction requires your confirmation.'])
    expect(selectNotifications(store.getState())[0].link).toEqual({
      href: { pathname: AppRoutes.spaces.transactions, query: { spaceId } },
      title: 'View transactions',
    })
  })

  it('should not toast again for the same tx after a remount', () => {
    mockQueue(page([queuedTx([wallet])]))
    const store = makeStore()
    renderPolling(store).unmount()

    renderPolling(store)

    expect(messages(store)).toHaveLength(1)
  })

  it('should aggregate several new signable txs into one toast', () => {
    mockQueue(page([queuedTx([wallet]), queuedTx([wallet])]))

    const { store } = renderPolling()

    expect(messages(store)).toEqual(['2 transactions require your confirmation.'])
  })

  it('should not toast for a tx the wallet cannot sign', () => {
    mockQueue(page([queuedTx([faker.finance.ethereumAddress()])]))

    const { store } = renderPolling()

    expect(messages(store)).toEqual([])
  })

  it('should not toast for a tx awaiting execution', () => {
    mockQueue(page([queuedTx([wallet], TransactionStatus.AWAITING_EXECUTION)]))

    const { store } = renderPolling()

    expect(messages(store)).toEqual([])
  })

  it('should not toast for a pending tx', () => {
    const tx = queuedTx([wallet])
    mockQueue(page([tx]))
    const store = makeStore()
    store.dispatch(
      setPendingTx({
        txId: tx.transaction.id,
        chainId,
        safeAddress,
        nonce: 1,
        status: PendingStatus.SIGNING,
        signerAddress: wallet,
      }),
    )

    renderPolling(store)

    expect(messages(store)).toEqual([])
  })
})

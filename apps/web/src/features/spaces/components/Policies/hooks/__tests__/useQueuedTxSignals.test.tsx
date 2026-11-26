import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { faker } from '@faker-js/faker'
import { act, renderHook } from '@testing-library/react'
import { cgwApi as spacesApi, type SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  cgwApi as transactionsApi,
  type TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { makeStore } from '@/store'
import { PendingStatus } from '@/store/pendingTxsSlice'
import { pendingTxBuilder } from '@/tests/builders/pendingTx'
import {
  multisigExecutionInfoBuilder,
  multisigTransactionBuilder,
  queuedTransactionItem,
} from '@/tests/builders/queuedTransaction'
import {
  multisigConfirmationBuilder,
  multisigExecutionDetailsBuilder,
  transactionDetailsBuilder,
} from '@/tests/builders/transactionDetails'
import { mockFullySignedPendingAllowlist } from '../../../../public/utils/allowlistPolicies'
import { getPendingTxId } from '../../utils/mapPendingPolicies'
import { useQueuedTxSignals } from '../useQueuedTxSignals'

const SPACE_ID = faker.string.uuid()

const row = mockFullySignedPendingAllowlist()
const TX_ID = getPendingTxId(row)

const queuedItem = (id: string, nonce: number) =>
  queuedTransactionItem(
    multisigTransactionBuilder()
      .with({ id, executionInfo: multisigExecutionInfoBuilder().with({ nonce }).build() })
      .build(),
  )

const queuePage = (
  items: ReturnType<typeof queuedItem>[],
  overrides: Partial<SpaceQueuedItemPage> = {},
): SpaceQueuedItemPage => ({
  count: items.length,
  next: null,
  previous: null,
  results: { [row.safe.address]: { [row.safe.chainId]: items } },
  unavailableSafes: [],
  counts: {
    total: items.length,
    execute: 0,
    sign: 0,
    blocked: 0,
    waiting: 0,
    conflicting: 0,
    stale: 0,
    safes: [],
    chains: [],
    signers: [],
  },
  ...overrides,
})

const ROW_TX = queuedItem(TX_ID, row.nonce)
const OTHER_TX = queuedItem(`multisig_${row.safe.address}_${faker.string.hexadecimal({ length: 64 })}`, row.nonce + 1)

const details = (txStatus: TransactionDetails['txStatus'], signatures = 2): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txId: TX_ID,
      txStatus,
      detailedExecutionInfo: multisigExecutionDetailsBuilder()
        .with({ confirmations: Array.from({ length: signatures }, () => multisigConfirmationBuilder().build()) })
        .build(),
    })
    .build()

const renderSignals = (store = makeStore()) => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  const view = renderHook(() => useQueuedTxSignals([row], SPACE_ID), { wrapper })
  // RTK batches its store notifications, so each cache update is read on a render of its own.
  const settle = async (update: () => unknown) => {
    await act(async () => {
      await update()
    })
    view.rerender()
  }

  return {
    result: view.result,
    serveQueue: (page: SpaceQueuedItemPage) =>
      settle(() =>
        store.dispatch(
          spacesApi.util.upsertQueryData('spaceTransactionsGetTransactionQueueV1', { spaceId: SPACE_ID }, page),
        ),
      ),
    serveDetails: (txDetails: TransactionDetails) =>
      settle(() =>
        store.dispatch(
          transactionsApi.util.upsertQueryData(
            'transactionsGetTransactionByIdV1',
            { chainId: row.safe.chainId, id: TX_ID },
            txDetails,
          ),
        ),
      ),
  }
}

describe('useQueuedTxSignals', () => {
  it.each([PendingStatus.PROCESSING, PendingStatus.RELAYING, PendingStatus.INDEXING])(
    'should, when this browser holds the transaction as %s, count it as executed',
    (status) => {
      const store = makeStore({ pendingTxs: { [TX_ID]: pendingTxBuilder().with({ status }).build() } })

      const { result } = renderSignals(store)

      expect(result.current.executed).toEqual(new Set([TX_ID]))
    },
  )

  it.each([PendingStatus.SIGNING, PendingStatus.SUBMITTING])(
    'should, when this browser holds the transaction as %s, not count it as executed',
    (status) => {
      const store = makeStore({ pendingTxs: { [TX_ID]: pendingTxBuilder().with({ status }).build() } })

      const { result } = renderSignals(store)

      expect(result.current.executed).toEqual(new Set())
    },
  )

  it("should, when CGW's cached details say the transaction succeeded while it is still listed, count it as executed", async () => {
    const { result, serveDetails } = renderSignals()

    await serveDetails(details('SUCCESS'))

    expect(result.current.executed).toEqual(new Set([TX_ID]))
    expect(result.current.failed).toEqual(new Set())
  })

  it.each(['FAILED', 'CANCELLED'] as const)(
    "should, when CGW's cached details say the transaction is %s, count it as failed",
    async (txStatus) => {
      const { result, serveDetails } = renderSignals()

      await serveDetails(details(txStatus))

      expect(result.current.failed).toEqual(new Set([TX_ID]))
      expect(result.current.executed).toEqual(new Set())
    },
  )

  it("should, when CGW's cached details count the signatures, report that count", async () => {
    const { result, serveDetails } = renderSignals()

    await serveDetails(details('AWAITING_EXECUTION', 3))

    expect(result.current.confirmations).toEqual(new Map([[TX_ID, 3]]))
  })

  it('should, when the Space queue listed the transaction and no longer does, report that it left the queue', async () => {
    const { result, serveQueue } = renderSignals()
    await serveQueue(queuePage([ROW_TX, OTHER_TX]))

    await serveQueue(queuePage([OTHER_TX]))

    expect(result.current.leftQueue).toEqual(new Set([TX_ID]))
  })

  it('should, while the Space queue still lists the transaction, not report that it left the queue', async () => {
    const { result, serveQueue } = renderSignals()

    await serveQueue(queuePage([ROW_TX, OTHER_TX]))

    expect(result.current.leftQueue).toEqual(new Set())
  })

  it('should, when the Space queue never listed the transaction, not report that it left the queue', async () => {
    const { result, serveQueue } = renderSignals()

    await serveQueue(queuePage([OTHER_TX]))

    expect(result.current.leftQueue).toEqual(new Set())
  })

  it("should, when the Space queue could not read the row's Safe, not report that the transaction left it", async () => {
    const { result, serveQueue } = renderSignals()
    await serveQueue(queuePage([ROW_TX]))

    await serveQueue(
      queuePage([], { unavailableSafes: [{ chainId: row.safe.chainId, safeAddress: row.safe.address }] }),
    )

    expect(result.current.leftQueue).toEqual(new Set())
  })

  it('should, when the Space queue was cut short of its total, not report that the transaction left it', async () => {
    const { result, serveQueue } = renderSignals()
    await serveQueue(queuePage([ROW_TX]))

    await serveQueue(queuePage([OTHER_TX], { count: 120 }))

    expect(result.current.leftQueue).toEqual(new Set())
  })
})

import { faker } from '@faker-js/faker'
import { act } from 'react'
import { http, HttpResponse } from 'msw'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionListItemType, TransactionStatus } from '@safe-global/store/gateway/types'
import { cgwClient, setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { POLLING_INTERVAL } from '@/config/constants'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { GATEWAY_URL } from '@/config/gateway'
import { getStoreInstance } from '@/store'
import { server } from '@/tests/server'
import { render, screen, waitFor } from '@/tests/test-utils'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import * as useChains from '@/hooks/useChains'
import type { SpaceQueueSection } from '../../hooks/useSpaceQueue'
import { useSpaceQueuePolling } from '../../hooks/useSpaceQueuePolling'
import SpaceTransactionQueue from './SpaceTransactionQueue'

const spaceId = faker.string.uuid()
const chainId = '1'
const safeAddress = faker.finance.ethereumAddress()
const txId = `multisig_${safeAddress}_${faker.string.hexadecimal({ length: 64 })}`

jest.mock('../../public/hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => spaceId }))
jest.mock('../../public/hooks/useSpaceMembers', () => ({
  ...jest.requireActual('../../public/hooks/useSpaceMembers'),
  useIsActiveMember: () => true,
}))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => null }))
jest.mock('@/store/authSlice', () => ({ ...jest.requireActual('@/store/authSlice'), isAuthenticated: () => true }))
jest.mock('./TransactionsToolbar/TransactionsToolbar', () => ({ __esModule: true, default: () => null }))
jest.mock('./SpaceQueueTable', () => ({
  __esModule: true,
  default: ({ sections }: { sections: SpaceQueueSection[] }) => (
    <>
      {sections.flatMap(({ chains }) =>
        chains.flatMap(({ items }) =>
          items.map((item) => {
            const { executionInfo } = (item as TransactionQueuedItem).transaction
            const submitted = isMultisigExecutionInfo(executionInfo) ? executionInfo.confirmationsSubmitted : 0
            return <div key={(item as TransactionQueuedItem).transaction.id}>{submitted} of 3 signatures</div>
          }),
        ),
      )}
    </>
  ),
}))

const queuePage = (confirmationsSubmitted: number): SpaceQueuedItemPage => ({
  count: 1,
  next: null,
  previous: null,
  results: {
    [safeAddress]: {
      [chainId]: [
        {
          type: TransactionListItemType.TRANSACTION,
          conflictType: 'None',
          transaction: safeTxSummaryBuilder()
            .with({
              id: txId,
              txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
              executionInfo: executionInfoBuilder()
                .with({ nonce: 3, confirmationsRequired: 3, confirmationsSubmitted, missingSigners: [] })
                .build(),
            })
            .build(),
        },
      ],
    },
  },
  unavailableSafes: [],
  counts: {
    total: 1,
    execute: 0,
    sign: 0,
    blocked: 0,
    waiting: 1,
    conflicting: 0,
    stale: 0,
    safes: [],
    chains: [],
    signers: [],
  },
})

const Poller = () => {
  useSpaceQueuePolling()
  return null
}

describe('SpaceTransactionQueue live updates', () => {
  beforeEach(() => {
    setBaseUrl(GATEWAY_URL)
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('shows another owner signature at the next poll, with one request per poll', async () => {
    let confirmations = 1
    const requests: URL[] = []
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json(queuePage(confirmations))
      }),
    )

    render(
      <>
        <Poller />
        <SpaceTransactionQueue spaceId={spaceId} />
      </>,
    )

    expect(await screen.findByText('1 of 3 signatures')).toBeInTheDocument()
    expect(requests).toHaveLength(1)

    confirmations = 2
    await act(() => jest.advanceTimersByTimeAsync(POLLING_INTERVAL))

    expect(await screen.findByText('2 of 3 signatures')).toBeInTheDocument()
    expect(requests).toHaveLength(2)
    expect(requests.every((url) => url.search === '')).toBe(true)
  })

  it('sends one request per transaction event with the page and the poller mounted', async () => {
    const requests: URL[] = []
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json(queuePage(1))
      }),
    )
    render(
      <>
        <Poller />
        <SpaceTransactionQueue spaceId={spaceId} />
      </>,
    )
    expect(await screen.findByText('1 of 3 signatures')).toBeInTheDocument()

    await act(async () => txDispatch(TxEvent.DELETED, { safeTxHash: faker.string.hexadecimal({ length: 64 }) }))
    await waitFor(() => expect(requests).toHaveLength(2))
    await act(() => jest.advanceTimersByTimeAsync(POLLING_INTERVAL - 1))

    expect(requests).toHaveLength(2)
  })

  it('stops polling while the tab is hidden and resumes once it is focused again', async () => {
    const requests: URL[] = []
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json(queuePage(1))
      }),
    )
    render(
      <>
        <Poller />
        <SpaceTransactionQueue spaceId={spaceId} />
      </>,
    )
    expect(await screen.findByText('1 of 3 signatures')).toBeInTheDocument()

    act(() => {
      getStoreInstance().dispatch(cgwClient.internalActions.onFocusLost())
    })
    await act(() => jest.advanceTimersByTimeAsync(POLLING_INTERVAL * 4))

    expect(requests).toHaveLength(1)

    act(() => {
      getStoreInstance().dispatch(cgwClient.internalActions.onFocus())
    })
    await act(() => jest.advanceTimersByTimeAsync(POLLING_INTERVAL))

    await waitFor(() => expect(requests).toHaveLength(2))
  })

  describe('when the service is busy', () => {
    const SECOND = 1_000
    const HTML_503 = 'html 503'
    let status: number | typeof HTML_503
    let requestTimes: number[]

    const serveQueue = () => {
      status = 200
      requestTimes = []
      server.use(
        http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`, () => {
          requestTimes.push(Date.now())
          if (status === 200) {
            return HttpResponse.json(queuePage(1))
          }
          if (status === HTML_503) {
            return HttpResponse.html('<html><body>503 Service Unavailable</body></html>', { status: 503 })
          }
          return new HttpResponse(null, { status })
        }),
      )
    }

    const renderQueue = async () => {
      render(
        <>
          <Poller />
          <SpaceTransactionQueue spaceId={spaceId} />
        </>,
      )
      await screen.findByText('1 of 3 signatures')
    }

    const runPolls = async (count: number) => {
      const target = requestTimes.length + count
      while (requestTimes.length < target) {
        await act(() => jest.advanceTimersByTimeAsync(SECOND))
      }
      await act(() => jest.advanceTimersByTimeAsync(0))
    }

    const gapsInSeconds = (times: number[]) => times.slice(1).map((time, i) => Math.round((time - times[i]) / SECOND))

    beforeEach(serveQueue)

    it.each([429, 503])('keeps the last queue and shows a notice when a poll gets a %i', async (failure) => {
      await renderQueue()

      status = failure
      await runPolls(1)

      expect(await screen.findByText("Couldn't refresh the queue")).toBeInTheDocument()
      expect(screen.getByText('1 of 3 signatures')).toBeInTheDocument()
      expect(screen.queryByText("Couldn't load the queue")).not.toBeInTheDocument()
    })

    it('backs off and shows a notice when a proxy answers a poll with an HTML 503', async () => {
      await renderQueue()

      status = HTML_503
      await runPolls(3)

      expect(await screen.findByText("Couldn't refresh the queue")).toBeInTheDocument()
      expect(screen.getByText('1 of 3 signatures')).toBeInTheDocument()
      expect(gapsInSeconds(requestTimes)).toEqual([15, 30, 60])
    })

    it('doubles the wait after each failed poll, from 15s up to 5 minutes', async () => {
      await renderQueue()

      status = 503
      await runPolls(8)

      expect(gapsInSeconds(requestTimes)).toEqual([15, 30, 60, 120, 240, 300, 300, 300])
    })

    it('hides the notice and polls every 15s again after a successful poll', async () => {
      await renderQueue()
      status = 503
      await runPolls(3)
      await screen.findByText("Couldn't refresh the queue")

      status = 200
      await runPolls(3)

      await waitFor(() => expect(screen.queryByText("Couldn't refresh the queue")).not.toBeInTheDocument())
      expect(gapsInSeconds(requestTimes.slice(-3))).toEqual([15, 15])
    })
  })
})

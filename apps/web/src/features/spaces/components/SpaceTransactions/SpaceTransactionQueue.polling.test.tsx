import { faker } from '@faker-js/faker'
import { act } from 'react'
import { http, HttpResponse } from 'msw'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionListItemType, TransactionStatus } from '@safe-global/store/gateway/types'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { POLLING_INTERVAL } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { render, screen } from '@/tests/test-utils'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import * as useChains from '@/hooks/useChains'
import type { SpaceQueueSection } from '../../store/spaceQueueApi'
import { useSpaceQueuePolling } from '../../hooks/useSpaceQueuePolling'
import SpaceTransactionQueue from './SpaceTransactionQueue'

const spaceId = faker.string.uuid()
const chainId = '1'
const safeAddress = faker.finance.ethereumAddress()
const txId = `multisig_${safeAddress}_${faker.string.hexadecimal({ length: 64 })}`

jest.mock('../../hooks/useCurrentSpaceId', () => ({ useCurrentSpaceId: () => spaceId }))
jest.mock('../../hooks/useSpaceMembers', () => ({
  ...jest.requireActual('../../hooks/useSpaceMembers'),
  useIsActiveMember: () => true,
}))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: () => null }))
jest.mock('@/store/authSlice', () => ({ ...jest.requireActual('@/store/authSlice'), isAuthenticated: () => true }))
jest.mock('./TransactionsToolbar', () => ({ __esModule: true, default: () => null }))
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
})

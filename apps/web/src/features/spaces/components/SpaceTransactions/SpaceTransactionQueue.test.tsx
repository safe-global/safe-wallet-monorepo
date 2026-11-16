import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import type { SpaceQueuedItemPage, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { TransactionListItemType } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import type { SpaceQueueSection } from '../../hooks/useSpaceQueue'
import SpaceTransactionQueue from './SpaceTransactionQueue'

jest.mock('./TransactionsToolbar', () => ({ __esModule: true, default: () => null }))

jest.mock('./SpaceQueueTable', () => ({
  __esModule: true,
  default: ({ sections }: { sections: SpaceQueueSection[] }) => (
    <>
      {sections.map((section) => (
        <div key={section.safeAddress} data-testid="space-queue-safe">
          {section.chains.length} chains of {section.safeAddress}
        </div>
      ))}
    </>
  ),
}))

const transactions = (count: number): TransactionQueuedItem[] =>
  Array.from({ length: count }, () => ({
    type: TransactionListItemType.TRANSACTION,
    conflictType: 'None',
    transaction: safeTxSummaryBuilder().build(),
  }))

const page = (
  results: SpaceQueuedItemPage['results'],
  overrides: Partial<SpaceQueuedItemPage> = {},
): SpaceQueuedItemPage => ({
  count: null,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
  counts: {
    total: 0,
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

describe('SpaceTransactionQueue', () => {
  const spaceId = faker.string.uuid()
  const queueUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())

  const respondWith = (body: SpaceQueuedItemPage | null, status = 200) => {
    const requests: Request[] = []
    server.use(
      http.get(queueUrl, ({ request }) => {
        requests.push(request)
        return body ? HttpResponse.json(body) : new HttpResponse(null, { status })
      }),
    )
    return requests
  }

  beforeEach(() => {
    setBaseUrl(GATEWAY_URL)
  })

  it('requests the queue of the Space and renders one section per Safe', async () => {
    respondWith(page({ [safeA]: { '1': transactions(1), '10': transactions(1) }, [safeB]: { '137': transactions(1) } }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    const sections = await screen.findAllByTestId('space-queue-safe')
    expect(sections).toHaveLength(2)
    expect(sections[0]).toHaveTextContent(`2 chains of ${safeA}`)
    expect(sections[1]).toHaveTextContent(`1 chains of ${safeB}`)
  })

  it('tells how many of the queued transactions are shown when the gateway capped the queue', async () => {
    respondWith(page({ [safeA]: { '1': transactions(3) } }, { count: 742 }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(await screen.findByText('Showing 3 of 742 pending transactions.')).toBeInTheDocument()
  })

  it('does not mention a cap when the whole queue was returned', async () => {
    respondWith(page({ [safeA]: { '1': transactions(3) } }, { count: 3 }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    await screen.findByTestId('space-queue-safe')
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument()
  })

  it('shows the empty state when no Safe has pending transactions', async () => {
    respondWith(page({}, { count: 0 }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(await screen.findByText('Pending transactions of your Safe accounts will appear here')).toBeInTheDocument()
  })

  it('shows skeletons while the first queue loads', () => {
    respondWith(page({ [safeA]: { '1': transactions(1) } }))

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(screen.queryByText('Pending transactions of your Safe accounts will appear here')).not.toBeInTheDocument()
    expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument()
  })

  it('shows an error when the queue fails to load', async () => {
    respondWith(null, 500)

    render(<SpaceTransactionQueue spaceId={spaceId} />)

    expect(await screen.findByText("Couldn't load the queue")).toBeInTheDocument()
    expect(screen.queryByTestId('space-queue-safe')).not.toBeInTheDocument()
  })

  it('requests the queue again on retry', async () => {
    const requests = respondWith(null, 500)
    render(<SpaceTransactionQueue spaceId={spaceId} />)
    await screen.findByText("Couldn't load the queue")

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(requests).toHaveLength(2))
  })
})

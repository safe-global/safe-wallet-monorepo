import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import SpaceTransactionsPage from './Page'

jest.mock('../AuthState', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
jest.mock('./NewTransactionButton', () => ({ __esModule: true, default: () => null }))
jest.mock('@/services/analytics', () =>
  (
    jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }
  ).createAnalyticsMock(),
)
const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>

const HISTORY_TITLE = 'Workspace history is coming'

describe('SpaceTransactionsPage', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear()
    setBaseUrl(GATEWAY_URL)
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/transactions/queued`, () =>
        HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: {},
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
        }),
      ),
    )
  })

  it('resets the queue filters when switching to another Workspace', () => {
    const { rerender } = render(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Filter' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Urgency' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Sign/ }))
    expect(screen.getByText('Urgency:')).toBeInTheDocument()

    rerender(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)

    expect(screen.queryByText('Urgency:')).not.toBeInTheDocument()
  })

  it('empties the search when switching to another Workspace', () => {
    const { rerender } = render(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search transactions' }), { target: { value: 'polygon' } })

    rerender(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)

    expect(screen.getByRole('searchbox', { name: 'Search transactions' })).toHaveValue('')
  })

  describe('History tab', () => {
    const openHistory = () => fireEvent.click(screen.getByRole('tab', { name: 'History' }))

    it('comes after Pending, which is selected by default', () => {
      render(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)

      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Pending', 'History'])
      expect(screen.getByRole('tab', { name: 'Pending' })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('searchbox', { name: 'Search transactions' })).toBeInTheDocument()
      expect(screen.queryByText(HISTORY_TITLE)).not.toBeInTheDocument()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('says where the history is, without a search field, filters or list', () => {
      render(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)

      openHistory()

      expect(screen.getByRole('heading', { name: HISTORY_TITLE })).toBeInTheDocument()
      expect(screen.getByText('Until then, you can find the transaction history inside each Safe.')).toBeInTheDocument()
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Filter' })).not.toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('requests nothing', async () => {
      render(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)
      await screen.findByText('Pending transactions of your Safe accounts will appear here')
      const requests: string[] = []
      const onRequest = ({ request }: { request: Request }) => requests.push(request.url)
      server.events.on('request:start', onRequest)

      openHistory()
      await screen.findByRole('heading', { name: HISTORY_TITLE })
      await new Promise((resolve) => setTimeout(resolve, 50))

      server.events.removeListener('request:start', onRequest)
      expect(requests).toEqual([])
    })

    it('tracks once each time it is opened', async () => {
      render(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)

      openHistory()

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(SPACE_EVENTS.TRANSACTIONS_HISTORY_TAB_OPENED, undefined)

      fireEvent.click(screen.getByRole('tab', { name: 'Pending' }))
      await waitFor(() => expect(screen.queryByText(HISTORY_TITLE)).not.toBeInTheDocument())

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)

      openHistory()

      expect(mockTrackEvent).toHaveBeenCalledTimes(2)
    })

    it('gives the queue back when returning to Pending', async () => {
      render(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)

      openHistory()
      fireEvent.click(screen.getByRole('tab', { name: 'Pending' }))

      await waitFor(() => expect(screen.getByRole('searchbox', { name: 'Search transactions' })).toBeInTheDocument())
      expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
      expect(screen.queryByText(HISTORY_TITLE)).not.toBeInTheDocument()
    })
  })
})

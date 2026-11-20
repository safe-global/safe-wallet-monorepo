import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import SpaceTransactionsPage from './Page'

jest.mock('../AuthState', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
jest.mock('./NewTransactionButton', () => ({ __esModule: true, default: () => null }))

describe('SpaceTransactionsPage', () => {
  beforeEach(() => {
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

  it('requests the queue of the Workspace switched to', async () => {
    const requestedSpaceIds: string[] = []
    server.use(
      http.get(`${GATEWAY_URL}/v1/spaces/:spaceId/transactions/queued`, ({ params }) => {
        requestedSpaceIds.push(params.spaceId as string)
        return HttpResponse.json({
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
        })
      }),
    )
    const previousSpaceId = faker.string.uuid()
    const nextSpaceId = faker.string.uuid()
    const { rerender } = render(<SpaceTransactionsPage spaceId={previousSpaceId} />)

    rerender(<SpaceTransactionsPage spaceId={nextSpaceId} />)

    await waitFor(() => expect(requestedSpaceIds).toContain(nextSpaceId))
  })

  it('empties the search when switching to another Workspace', () => {
    const { rerender } = render(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search transactions' }), { target: { value: 'polygon' } })

    rerender(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)

    expect(screen.getByRole('searchbox', { name: 'Search transactions' })).toHaveValue('')
  })
})

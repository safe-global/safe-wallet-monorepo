import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fireEvent, render, screen } from '@/tests/test-utils'
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
    fireEvent.click(screen.getByRole('button', { name: 'Status' }))
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Sign/ }))
    expect(screen.getByText('Status:')).toBeInTheDocument()

    rerender(<SpaceTransactionsPage spaceId={faker.string.uuid()} />)

    expect(screen.queryByText('Status:')).not.toBeInTheDocument()
  })
})

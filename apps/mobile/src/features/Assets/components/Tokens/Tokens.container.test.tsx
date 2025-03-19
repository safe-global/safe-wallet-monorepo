import React from 'react'
import { render, screen } from '@/src/tests/test-utils'
import { TokensContainer } from './Tokens.container'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'

// Mock active safe selector with memoized object
const mockActiveSafe = { chainId: '1', address: '0x123' }

jest.mock('@/src/store/activeSafeSlice', () => ({
  selectActiveSafe: () => mockActiveSafe,
}))

describe('TokensContainer', () => {
  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it('renders loading state initially', () => {
    render(<TokensContainer />)
    expect(screen.getByTestId('fallback')).toBeTruthy()
  })

  it('renders error state when API fails', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/api/v1/chains/:chainId/safes/:safeAddress/balances/usd`, () => {
        return HttpResponse.error()
      }),
    )

    render(<TokensContainer />)

    expect(await screen.findByTestId('fallback')).toBeTruthy()
  })

  it('renders token list when data is available', async () => {
    // Setup response spy
    render(<TokensContainer />)

    // First verify we see the loading state
    expect(screen.getByTestId('fallback')).toBeTruthy()

    // Then check for content
    const ethText = await screen.findByText('Ethereum')
    const ethAmount = await screen.findByText('1 ETH')
    const ethValue = await screen.findByText('$ 2,000')

    expect(ethText).toBeTruthy()
    expect(ethAmount).toBeTruthy()
    expect(ethValue).toBeTruthy()
  })

  it('renders fallback when data is empty', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/api/v1/chains/:chainId/safes/:safeAddress/balances/usd`, () => {
        return HttpResponse.json({ items: [] })
      }),
    )

    render(<TokensContainer />)

    expect(await screen.findByTestId('fallback')).toBeTruthy()
  })
})

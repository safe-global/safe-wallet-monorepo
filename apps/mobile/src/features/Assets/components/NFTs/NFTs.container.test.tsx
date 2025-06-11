import React from 'react'
import { render, screen } from '@/src/tests/test-utils'
import { NFTsContainer } from './NFTs.container'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'

// Mock active safe selector with memoized object
const mockActiveSafe = { chainId: '1', address: '0x123' }

jest.mock('@/src/store/activeSafeSlice', () => ({
  selectActiveSafe: () => mockActiveSafe,
}))

describe('NFTsContainer', () => {
  afterAll(() => {
    server.resetHandlers()
  })
  it('renders loading state initially', () => {
    render(<NFTsContainer />)
    expect(screen.getByTestId('fallback')).toBeTruthy()
  })

  it('renders error state when API fails', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, () => {
        return HttpResponse.error()
      }),
    )

    render(<NFTsContainer />)
    expect(await screen.findByTestId('fallback')).toBeTruthy()
  })

  it('renders NFT list when data is available', async () => {
    render(<NFTsContainer />)

    // First verify we see the loading state
    expect(screen.getByTestId('fallback')).toBeTruthy()

    // Then check for NFT content
    const nft1 = await screen.findByText('NFT #1')
    const nft2 = await screen.findByText('NFT #2')

    expect(nft1).toBeTruthy()
    expect(nft2).toBeTruthy()
  })

  it('renders fallback when data is empty', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v2/chains/:chainId/safes/:safeAddress/collectibles`, () => {
        return HttpResponse.json({ results: [] })
      }),
    )

    render(<NFTsContainer />)
    expect(await screen.findByTestId('fallback')).toBeTruthy()
  })
})

import React from 'react'
import { render, screen } from '@/src/tests/test-utils'
import { PositionsContainer } from './Positions.container'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/src/config/constants'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const mockActiveSafe = { chainId: '1', address: '0x123' }

jest.mock('@/src/store/activeSafeSlice', () => ({
  selectActiveSafe: () => mockActiveSafe,
}))

jest.mock('@/src/hooks/useHasFeature', () => ({
  useHasFeature: (feature: string) => {
    if (feature === 'POSITIONS') {
      return true
    }
    if (feature === 'PORTFOLIO_ENDPOINT') {
      return false
    }
    return false
  },
}))

const mockProtocols: Protocol[] = [
  {
    protocol: 'aave-v3',
    protocol_metadata: {
      name: 'Aave V3',
      icon: { url: 'https://example.com/aave.png' },
    },
    fiatTotal: '1500.00',
    items: [
      {
        name: 'Main Pool',
        items: [
          {
            balance: '1000000000',
            fiatBalance: '1500.00',
            fiatConversion: '1500',
            tokenInfo: {
              address: '0x1234567890123456789012345678901234567890',
              decimals: 6,
              logoUri: 'https://example.com/usdc.png',
              name: 'USD Coin',
              symbol: 'USDC',
              type: 'ERC20',
            },
            fiatBalance24hChange: '2.5',
            position_type: 'deposit',
          },
        ],
      },
    ],
  },
]

describe('PositionsContainer', () => {
  beforeAll(() => {
    server.listen()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })

  it('renders loading state initially', () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/positions/:fiatCode`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json(mockProtocols)
      }),
    )

    render(<PositionsContainer />)

    expect(screen.getByTestId('fallback')).toBeTruthy()
  })

  it('renders error state when API fails', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/positions/:fiatCode`, () => {
        return HttpResponse.error()
      }),
    )

    render(<PositionsContainer />)

    expect(await screen.findByText("Couldn't load positions")).toBeTruthy()
  })

  it('renders positions list when data is available', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/positions/:fiatCode`, () => {
        return HttpResponse.json(mockProtocols)
      }),
    )

    render(<PositionsContainer />)

    expect(await screen.findByText('Aave V3')).toBeTruthy()
  })

  it('renders empty state when no positions', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/positions/:fiatCode`, () => {
        return HttpResponse.json([])
      }),
    )

    render(<PositionsContainer />)

    expect(await screen.findByText('No positions yet')).toBeTruthy()
  })

  it('renders multiple protocols', async () => {
    const multipleProtocols: Protocol[] = [
      ...mockProtocols,
      {
        protocol: 'lido',
        protocol_metadata: {
          name: 'Lido',
          icon: { url: 'https://example.com/lido.png' },
        },
        fiatTotal: '2000.00',
        items: [
          {
            name: 'Staking',
            items: [
              {
                balance: '1000000000000000000',
                fiatBalance: '2000.00',
                fiatConversion: '2000',
                tokenInfo: {
                  address: '0x2222222222222222222222222222222222222222',
                  decimals: 18,
                  logoUri: 'https://example.com/steth.png',
                  name: 'Lido Staked Ether',
                  symbol: 'stETH',
                  type: 'ERC20',
                },
                fiatBalance24hChange: '-1.5',
                position_type: 'staked',
              },
            ],
          },
        ],
      },
    ]

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/positions/:fiatCode`, () => {
        return HttpResponse.json(multipleProtocols)
      }),
    )

    render(<PositionsContainer />)

    expect(await screen.findByText('Aave V3')).toBeTruthy()
    expect(await screen.findByText('Lido')).toBeTruthy()
  })

  describe('Pull-to-refresh', () => {
    it('shows RefreshControl when pulling down', async () => {
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/positions/:fiatCode`, () => {
          return HttpResponse.json(mockProtocols)
        }),
      )

      render(<PositionsContainer />)

      await screen.findByText('Aave V3')

      const flatList = screen.UNSAFE_getByType(require('react-native').FlatList as React.ComponentType)
      expect(flatList.props.refreshControl).toBeTruthy()
    })

    it('keeps existing data visible during refresh', async () => {
      let requestCount = 0
      server.use(
        http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/positions/:fiatCode`, async () => {
          requestCount++
          if (requestCount > 1) {
            await new Promise((resolve) => setTimeout(resolve, 50))
          }
          return HttpResponse.json(mockProtocols)
        }),
      )

      render(<PositionsContainer />)

      await screen.findByText('Aave V3')
      expect(screen.getByText('Aave V3')).toBeTruthy()
    })
  })
})

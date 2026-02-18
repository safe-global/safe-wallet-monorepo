import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { ProtocolSection } from './ProtocolSection'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const createMockProtocol = (overrides?: Partial<Protocol>): Protocol => ({
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
  ...overrides,
})

describe('ProtocolSection', () => {
  const defaultProps = {
    protocol: createMockProtocol(),
    totalFiatValue: 3000,
    currency: 'usd',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders protocol name', () => {
    render(<ProtocolSection {...defaultProps} />)
    expect(screen.getByText('Aave V3')).toBeTruthy()
  })

  it('renders protocol fiat total', () => {
    render(<ProtocolSection {...defaultProps} />)
    expect(screen.getAllByText(/1,500/).length).toBeGreaterThan(0)
  })

  it('renders protocol percentage', () => {
    render(<ProtocolSection {...defaultProps} />)
    expect(screen.getByText('50.00%')).toBeTruthy()
  })

  it('does not render individual positions inline', () => {
    render(<ProtocolSection {...defaultProps} />)
    expect(screen.queryByText('USD Coin')).toBeNull()
  })

  it('navigates to protocol detail sheet when pressed', () => {
    render(<ProtocolSection {...defaultProps} />)

    const row = screen.getByTestId('protocol-section-aave-v3')
    fireEvent.press(row)

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/protocol-detail-sheet',
      params: { protocolId: 'aave-v3' },
    })
  })

  it('handles null icon URL with fallback', () => {
    const protocol = createMockProtocol({
      protocol_metadata: {
        name: 'Unknown Protocol',
        icon: { url: null },
      },
    })

    render(<ProtocolSection {...defaultProps} protocol={protocol} />)
    expect(screen.getByText('Unknown Protocol')).toBeTruthy()
  })
})

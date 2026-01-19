import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { ProtocolSection } from './ProtocolSection'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

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

  it('renders positions when expanded by default', () => {
    render(<ProtocolSection {...defaultProps} />)
    expect(screen.getByText('USD Coin')).toBeTruthy()
  })

  it('collapses positions when header is pressed', () => {
    render(<ProtocolSection {...defaultProps} />)

    const header = screen.getByTestId('protocol-section-header')
    fireEvent.press(header)

    expect(screen.queryByText('USD Coin')).toBeNull()
  })

  it('expands positions when collapsed header is pressed', () => {
    render(<ProtocolSection {...defaultProps} />)

    const header = screen.getByTestId('protocol-section-header')
    fireEvent.press(header)
    fireEvent.press(header)

    expect(screen.getByText('USD Coin')).toBeTruthy()
  })

  it('handles protocol with multiple positions', () => {
    const protocol = createMockProtocol({
      items: [
        {
          name: 'Main Pool',
          items: [
            {
              balance: '1000000000',
              fiatBalance: '1000.00',
              fiatConversion: '1000',
              tokenInfo: {
                address: '0x1111111111111111111111111111111111111111',
                decimals: 6,
                logoUri: 'https://example.com/usdc.png',
                name: 'USD Coin',
                symbol: 'USDC',
                type: 'ERC20',
              },
              fiatBalance24hChange: '1.5',
              position_type: 'deposit',
            },
            {
              balance: '500000000000000000',
              fiatBalance: '500.00',
              fiatConversion: '500',
              tokenInfo: {
                address: '0x2222222222222222222222222222222222222222',
                decimals: 18,
                logoUri: 'https://example.com/eth.png',
                name: 'Ethereum',
                symbol: 'ETH',
                type: 'NATIVE_TOKEN',
              },
              fiatBalance24hChange: '-2.0',
              position_type: 'staked',
            },
          ],
        },
      ],
    })

    render(<ProtocolSection {...defaultProps} protocol={protocol} />)

    expect(screen.getByText('USD Coin')).toBeTruthy()
    expect(screen.getByText('Ethereum')).toBeTruthy()
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

import React from 'react'
import { render, screen } from '@/src/tests/test-utils'
import { PositionItem } from './PositionItem'
import type { Position } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const createMockPosition = (overrides?: Partial<Position>): Position => ({
  balance: '1000000000000000000',
  fiatBalance: '1500.00',
  fiatConversion: '1500',
  tokenInfo: {
    address: '0x1234567890123456789012345678901234567890',
    decimals: 18,
    logoUri: 'https://example.com/token.png',
    name: 'USD Coin',
    symbol: 'USDC',
    type: 'ERC20',
  },
  fiatBalance24hChange: '2.5',
  position_type: 'deposit',
  ...overrides,
})

describe('PositionItem', () => {
  it('renders position name and symbol', () => {
    const position = createMockPosition()
    render(<PositionItem position={position} currency="usd" />)

    expect(screen.getByText('USD Coin')).toBeTruthy()
  })

  it('renders formatted balance', () => {
    const position = createMockPosition()
    render(<PositionItem position={position} currency="usd" />)

    expect(screen.getByText(/1 USDC/)).toBeTruthy()
  })

  it('renders fiat value', () => {
    const position = createMockPosition()
    render(<PositionItem position={position} currency="usd" />)

    expect(screen.getByText(/1,500/)).toBeTruthy()
  })

  it('renders position type label', () => {
    const position = createMockPosition({ position_type: 'staked' })
    render(<PositionItem position={position} currency="usd" />)

    expect(screen.getByText('Staking')).toBeTruthy()
  })

  it('renders "Unknown" for null position type', () => {
    const position = createMockPosition({ position_type: null })
    render(<PositionItem position={position} currency="usd" />)

    expect(screen.getByText('Unknown')).toBeTruthy()
  })

  it('renders positive 24h change', () => {
    const position = createMockPosition({ fiatBalance24hChange: '5.0' })
    render(<PositionItem position={position} currency="usd" />)

    expect(screen.getByText(/\+.*5/)).toBeTruthy()
  })

  it('renders negative 24h change', () => {
    const position = createMockPosition({ fiatBalance24hChange: '-3.5' })
    render(<PositionItem position={position} currency="usd" />)

    expect(screen.getByText(/-.*3.5/)).toBeTruthy()
  })

  it('handles null 24h change', () => {
    const position = createMockPosition({ fiatBalance24hChange: null })
    render(<PositionItem position={position} currency="usd" />)

    expect(screen.getByText('0%')).toBeTruthy()
  })
})

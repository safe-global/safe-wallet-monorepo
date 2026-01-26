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
  it('renders correctly', () => {
    const position = createMockPosition()
    const { toJSON } = render(<PositionItem position={position} currency="usd" />)

    expect(toJSON()).toMatchSnapshot()
  })

  it('renders "Unknown" for null position type', () => {
    const position = createMockPosition({ position_type: null })
    render(<PositionItem position={position} currency="usd" />)

    expect(screen.getByText('Unknown')).toBeTruthy()
  })
})

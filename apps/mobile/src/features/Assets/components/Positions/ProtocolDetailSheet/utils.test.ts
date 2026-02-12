import { calculateProtocolFiatChange } from './utils'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const createMockProtocol = (overrides?: Partial<Protocol>): Protocol => ({
  protocol: 'aave-v3',
  protocol_metadata: { name: 'Aave V3', icon: { url: 'https://example.com/aave.png' } },
  fiatTotal: '1000.00',
  items: [
    {
      name: 'Main Pool',
      items: [
        {
          balance: '1000000000',
          fiatBalance: '1000.00',
          fiatConversion: '1000',
          tokenInfo: {
            address: '0x1234567890123456789012345678901234567890',
            decimals: 6,
            logoUri: 'https://example.com/usdc.png',
            name: 'USD Coin',
            symbol: 'USDC',
            type: 'ERC20',
          },
          fiatBalance24hChange: '5.0',
          position_type: 'deposit',
        },
      ],
    },
  ],
  ...overrides,
})

describe('calculateProtocolFiatChange', () => {
  it('calculates percentage change from a single position', () => {
    const protocol = createMockProtocol()
    const result = calculateProtocolFiatChange(protocol)
    // 5.0 means 5% in the API → 5/100 = 0.05
    // fiatBalance * change = 1000 * 0.05 = 50
    // 50 / 1000 (fiatTotal) = 0.05
    expect(result).toBeCloseTo(0.05)
  })

  it('returns null when fiatTotal is 0', () => {
    const protocol = createMockProtocol({ fiatTotal: '0' })
    expect(calculateProtocolFiatChange(protocol)).toBeNull()
  })

  it('returns null when all positions have null 24h change', () => {
    const protocol = createMockProtocol({
      items: [
        {
          name: 'Pool',
          items: [
            {
              balance: '100',
              fiatBalance: '500.00',
              fiatConversion: '500',
              tokenInfo: {
                address: '0x1111111111111111111111111111111111111111',
                decimals: 18,
                logoUri: '',
                name: 'Token',
                symbol: 'TKN',
                type: 'ERC20',
              },
              fiatBalance24hChange: null,
              position_type: 'deposit',
            },
          ],
        },
      ],
    })
    expect(calculateProtocolFiatChange(protocol)).toBeNull()
  })

  it('aggregates change across multiple positions', () => {
    const protocol = createMockProtocol({
      fiatTotal: '2000.00',
      items: [
        {
          name: 'Pool',
          items: [
            {
              balance: '1000',
              fiatBalance: '1000.00',
              fiatConversion: '1000',
              tokenInfo: {
                address: '0x1111111111111111111111111111111111111111',
                decimals: 6,
                logoUri: '',
                name: 'USDC',
                symbol: 'USDC',
                type: 'ERC20',
              },
              fiatBalance24hChange: '10.0', // +10% → +100
              position_type: 'deposit',
            },
            {
              balance: '500',
              fiatBalance: '1000.00',
              fiatConversion: '1000',
              tokenInfo: {
                address: '0x2222222222222222222222222222222222222222',
                decimals: 18,
                logoUri: '',
                name: 'ETH',
                symbol: 'ETH',
                type: 'NATIVE_TOKEN',
              },
              fiatBalance24hChange: '-4.0', // -4% → -40
              position_type: 'staked',
            },
          ],
        },
      ],
    })
    const result = calculateProtocolFiatChange(protocol)
    // (100 - 40) / 2000 = 0.03
    expect(result).toBeCloseTo(0.03)
  })

  it('skips positions with null change when aggregating', () => {
    const protocol = createMockProtocol({
      fiatTotal: '2000.00',
      items: [
        {
          name: 'Pool',
          items: [
            {
              balance: '1000',
              fiatBalance: '1000.00',
              fiatConversion: '1000',
              tokenInfo: {
                address: '0x1111111111111111111111111111111111111111',
                decimals: 6,
                logoUri: '',
                name: 'USDC',
                symbol: 'USDC',
                type: 'ERC20',
              },
              fiatBalance24hChange: '6.0', // +6% → +60
              position_type: 'deposit',
            },
            {
              balance: '500',
              fiatBalance: '1000.00',
              fiatConversion: '1000',
              tokenInfo: {
                address: '0x2222222222222222222222222222222222222222',
                decimals: 18,
                logoUri: '',
                name: 'ETH',
                symbol: 'ETH',
                type: 'NATIVE_TOKEN',
              },
              fiatBalance24hChange: null,
              position_type: 'staked',
            },
          ],
        },
      ],
    })
    const result = calculateProtocolFiatChange(protocol)
    // Only first position counted: 60 / 2000 = 0.03
    expect(result).toBeCloseTo(0.03)
  })
})

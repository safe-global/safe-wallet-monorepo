import { transformAppBalancesToProtocols } from '../utils/transformAppBalancesToProtocols'
import type { AppBalance } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'

const createMockAppBalance = (overrides?: Partial<AppBalance>): AppBalance => ({
  appInfo: {
    name: 'Aave V3',
    logoUrl: 'https://example.com/aave.png',
  },
  balanceFiat: '1500.00',
  groups: [
    {
      name: 'Main Pool',
      items: [
        {
          key: 'aave-usdc-deposit',
          name: 'USDC Deposit',
          type: 'deposit',
          balance: '100000000',
          balanceFiat: '1500.00',
          tokenInfo: {
            address: '0x1234567890123456789012345678901234567890',
            decimals: 6,
            logoUri: 'https://example.com/usdc.png',
            name: 'USD Coin',
            symbol: 'USDC',
            type: 'ERC20',
            chainId: '1',
            trusted: true,
          },
          priceChangePercentage1d: '0.5',
        },
      ],
    },
  ],
  ...overrides,
})

describe('transformAppBalancesToProtocols', () => {
  it('returns undefined for undefined input', () => {
    expect(transformAppBalancesToProtocols(undefined)).toBeUndefined()
  })

  it('returns empty array for empty input', () => {
    expect(transformAppBalancesToProtocols([])).toEqual([])
  })

  it('transforms single app balance to protocol', () => {
    const appBalances = [createMockAppBalance()]
    const result = transformAppBalancesToProtocols(appBalances)

    expect(result).toHaveLength(1)
    expect(result![0]).toEqual({
      protocol: 'Aave V3',
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
              balance: '100000000',
              fiatBalance: '1500.00',
              fiatConversion: '0',
              tokenInfo: {
                address: '0x1234567890123456789012345678901234567890',
                decimals: 6,
                logoUri: 'https://example.com/usdc.png',
                name: 'USD Coin',
                symbol: 'USDC',
                type: 'ERC20',
                chainId: '1',
                trusted: true,
              },
              fiatBalance24hChange: '0.5',
              position_type: 'deposit',
            },
          ],
        },
      ],
    })
  })

  it('handles undefined logo URL', () => {
    const appBalances = [
      createMockAppBalance({
        appInfo: { name: 'Test' },
      }),
    ]
    const result = transformAppBalancesToProtocols(appBalances)

    expect(result![0].protocol_metadata.icon.url).toBeNull()
  })

  it('handles missing balance fiat', () => {
    const appBalances = [
      createMockAppBalance({
        groups: [
          {
            name: 'Test Group',
            items: [
              {
                key: 'test-staked',
                name: 'Staked Test',
                type: 'staked',
                balance: '100',
                tokenInfo: {
                  address: '0x1234567890123456789012345678901234567890',
                  decimals: 18,
                  logoUri: '',
                  name: 'Test',
                  symbol: 'TST',
                  type: 'ERC20',
                  chainId: '1',
                  trusted: false,
                },
              },
            ],
          },
        ],
      }),
    ]
    const result = transformAppBalancesToProtocols(appBalances)

    expect(result![0].items[0].items[0].fiatBalance).toBe('0')
  })

  it('handles undefined price change percentage', () => {
    const appBalances = [
      createMockAppBalance({
        groups: [
          {
            name: 'Test',
            items: [
              {
                key: 'test-deposit',
                name: 'Test Deposit',
                type: 'deposit',
                balance: '100',
                balanceFiat: '100',
                tokenInfo: {
                  address: '0x1234567890123456789012345678901234567890',
                  decimals: 18,
                  logoUri: '',
                  name: 'Test',
                  symbol: 'TST',
                  type: 'ERC20',
                  chainId: '1',
                  trusted: false,
                },
              },
            ],
          },
        ],
      }),
    ]
    const result = transformAppBalancesToProtocols(appBalances)

    expect(result![0].items[0].items[0].fiatBalance24hChange).toBeNull()
  })

  it('transforms multiple app balances', () => {
    const appBalances = [
      createMockAppBalance({ appInfo: { name: 'Aave V3', logoUrl: 'aave.png' } }),
      createMockAppBalance({ appInfo: { name: 'Lido', logoUrl: 'lido.png' } }),
    ]
    const result = transformAppBalancesToProtocols(appBalances)

    expect(result).toHaveLength(2)
    expect(result![0].protocol).toBe('Aave V3')
    expect(result![1].protocol).toBe('Lido')
  })
})

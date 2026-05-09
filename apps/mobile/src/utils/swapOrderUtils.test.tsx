import { faker } from '@faker-js/faker'
import {
  priceRow,
  statusRow,
  expiryRow,
  orderIdRow,
  networkRow,
  slippageRow,
  widgetFeeRow,
  totalFeesRow,
  numberOfPartsRow,
  partSellAmountRow,
  partBuyAmountRow,
  formatSwapOrderItemsForConfirmation,
  formatSwapOrderItemsForHistory,
  formatTwapOrderItemsForHistory,
  formatTwapOrderItemsForConfirmation,
} from './swapOrderUtils'
import { OrderTransactionInfo, StartTimeValue } from '@safe-global/store/gateway/types'
import { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { generateAddress, createMockChain } from '@safe-global/test'

type LabelValueItem = {
  label: string | React.ReactNode
  value?: string
}

jest.mock('@/src/features/ConfirmTx/components/confirmation-views/SwapOrder/StatusLabel', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => `StatusLabel: ${status}`,
}))

const createMockToken = (overrides?: Partial<OrderTransactionInfo['sellToken']>) => ({
  address: generateAddress(),
  decimals: 18,
  logoUri: faker.image.url(),
  name: faker.finance.currencyName(),
  symbol: faker.finance.currencyCode(),
  trusted: true,
  ...overrides,
})

const createMockOrder = (overrides?: Record<string, unknown>): OrderTransactionInfo =>
  ({
    type: 'SwapOrder',
    status: 'open',
    uid: faker.string.uuid(),
    kind: 'sell',
    sellToken: createMockToken({ symbol: 'ETH', decimals: 18 }),
    buyToken: createMockToken({ symbol: 'USDC', decimals: 6 }),
    sellAmount: '1000000000000000000',
    buyAmount: '2000000000',
    executedSellAmount: '0',
    executedBuyAmount: '0',
    validUntil: Math.floor(Date.now() / 1000) + 3600,
    explorerUrl: 'https://explorer.cow.fi/orders/test',
    orderClass: 'market',
    executedFee: '0',
    executedFeeToken: createMockToken({ symbol: 'ETH', decimals: 18 }),
    humanDescription: null,
    receiver: generateAddress(),
    owner: generateAddress(),
    fullAppData: null,
    ...overrides,
  }) as OrderTransactionInfo

describe('swapOrderUtils', () => {
  describe('priceRow', () => {
    it('returns execution price for fulfilled orders', () => {
      const order = createMockOrder({
        status: 'fulfilled',
        sellAmount: '1000000000000000000',
        buyAmount: '2000000000',
        executedSellAmount: '1000000000000000000',
        executedBuyAmount: '2100000000',
      })

      const result = priceRow(order)

      expect(result.label).toBe('Execution price')
      expect(result.value).toContain('1 USDC =')
      expect(result.value).toContain('ETH')
    })

    it('returns limit price for non-fulfilled orders', () => {
      const order = createMockOrder({ status: 'open' })

      const result = priceRow(order)

      expect(result.label).toBe('Limit price')
      expect(result.value).toContain('1 USDC =')
    })

    it('returns limit price for cancelled orders', () => {
      const order = createMockOrder({ status: 'cancelled' })

      const result = priceRow(order)

      expect(result.label).toBe('Limit price')
    })
  })

  describe('statusRow', () => {
    it('returns status row with correct label', () => {
      const order = createMockOrder({ status: 'open' })

      const result = statusRow(order)

      expect(result.label).toBe('Status')
      expect(result.render).toBeDefined()
    })

    it('shows partiallyFilled status when order is partially filled', () => {
      const order = createMockOrder({
        status: 'open',
        executedSellAmount: '500000000000000000',
        sellAmount: '1000000000000000000',
      })

      const result = statusRow(order)

      expect(result.label).toBe('Status')
    })
  })

  describe('expiryRow', () => {
    it('returns formatted expiry date', () => {
      const validUntil = Math.floor(new Date('2025-12-25T14:30:00Z').getTime() / 1000)
      const order = createMockOrder({ validUntil })

      const result = expiryRow(order)

      expect(result.label).toBe('Expiry')
      expect(result.value).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/)
    })
  })

  describe('orderIdRow', () => {
    it('returns order ID row with uid', () => {
      const uid = 'order-123-abc-456'
      const order = createMockOrder({ uid })

      const result = orderIdRow(order)

      expect(result).not.toBeNull()
      expect(result?.label).toBe('Order ID')
      expect(result?.render).toBeDefined()
    })

    it('returns null for orders without uid', () => {
      const order = createMockOrder()
      delete (order as Record<string, unknown>).uid

      const result = orderIdRow(order as OrderTransactionInfo)

      expect(result).toBeNull()
    })
  })

  describe('networkRow', () => {
    it('returns network row with chain info', () => {
      const chain = createMockChain({ chainName: 'Polygon' })

      const result = networkRow(chain)

      expect(result.label).toBe('Network')
      expect(result.render).toBeDefined()
    })
  })

  describe('slippageRow', () => {
    it('returns null for limit orders', () => {
      const order = createMockOrder({
        fullAppData: {
          appCode: 'safe',
          metadata: {
            orderClass: { orderClass: 'limit' },
          },
        },
      })

      const result = slippageRow(order)

      expect(result).toBeNull()
    })

    it('returns slippage percentage for market orders', () => {
      const order = createMockOrder({
        fullAppData: {
          appCode: 'safe',
          metadata: {
            orderClass: { orderClass: 'market' },
          },
        },
      })

      const result = slippageRow(order)

      expect(result).not.toBeNull()
      expect(result?.label).toBe('Slippage')
      expect(result?.value).toContain('%')
    })
  })

  describe('widgetFeeRow', () => {
    it('returns widget fee percentage', () => {
      const order = createMockOrder({
        fullAppData: {
          appCode: 'safe',
          metadata: {
            partnerFee: { bps: 50, recipient: faker.finance.ethereumAddress() },
          },
        },
      })

      const result = widgetFeeRow(order)

      expect(result.label).toBe('Widget fee')
      expect(result.value).toContain('%')
    })

    it('returns 0% when no partner fee metadata', () => {
      const order = createMockOrder({ fullAppData: null })

      const result = widgetFeeRow(order)

      expect(result.value).toBe('0 %')
    })
  })

  describe('totalFeesRow', () => {
    it('returns null when no executed fee', () => {
      const order = createMockOrder({ executedFee: '0' })

      const result = totalFeesRow(order)

      expect(result).toBeNull()
    })

    it('returns formatted fee with buyToken for sell orders', () => {
      const order = createMockOrder({
        kind: 'sell',
        executedFee: '1000000',
        executedFeeToken: createMockToken({ symbol: 'USDC', decimals: 6 }),
      })

      const result = totalFeesRow(order)

      expect(result).not.toBeNull()
      expect(result?.label).toBe('Total fees')
    })

    it('returns formatted fee with sellToken for buy orders', () => {
      const order = createMockOrder({
        kind: 'buy',
        executedFee: '1000000000000000',
        executedFeeToken: createMockToken({ symbol: 'ETH', decimals: 18 }),
      })

      const result = totalFeesRow(order)

      expect(result).not.toBeNull()
    })

    it('returns formatted fee when executedFeeToken is TokenInfo object', () => {
      const feeToken = createMockToken({ symbol: 'DAI', decimals: 18 })
      const order = createMockOrder({
        executedFee: '1000000000000000000',
        executedFeeToken: feeToken,
      })

      const result = totalFeesRow(order)

      expect(result).not.toBeNull()
      expect(result?.value).toContain('DAI')
    })
  })

  describe('numberOfPartsRow', () => {
    it('returns number of parts', () => {
      const order = { numberOfParts: '5' }

      const result = numberOfPartsRow(order)

      expect(result.label).toBe('No of parts')
      expect(result.value).toBe('5')
    })
  })

  describe('partSellAmountRow', () => {
    it('returns formatted sell amount per part', () => {
      const order = {
        partSellAmount: '500000000000000000',
        sellToken: { decimals: 18, symbol: 'ETH' },
      }

      const result = partSellAmountRow(order)

      expect(result.label).toBe('Sell amount')
      expect(result.value).toContain('ETH per part')
    })
  })

  describe('partBuyAmountRow', () => {
    it('returns formatted buy amount per part', () => {
      const order = {
        minPartLimit: '1000000000',
        buyToken: { decimals: 6, symbol: 'USDC' },
      }

      const result = partBuyAmountRow(order)

      expect(result.label).toBe('Buy amount')
      expect(result.value).toContain('USDC per part')
    })
  })

  describe('formatSwapOrderItemsForConfirmation', () => {
    it('returns array of list items for confirmation view', () => {
      const order = createMockOrder()
      const chain = createMockChain()

      const result = formatSwapOrderItemsForConfirmation(order, chain) as LabelValueItem[]

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result.some((item) => item.label === 'Expiry')).toBe(true)
      expect(result.some((item) => item.label === 'Network')).toBe(true)
      expect(result.some((item) => item.label === 'Status')).toBe(true)
    })

    it('filters out null items', () => {
      const order = createMockOrder({
        fullAppData: {
          appCode: 'safe',
          metadata: {
            orderClass: { orderClass: 'limit' },
          },
        },
      })
      delete (order as Record<string, unknown>).uid
      const chain = createMockChain()

      const result = formatSwapOrderItemsForConfirmation(order as OrderTransactionInfo, chain)

      expect(result.every((item) => item !== null)).toBe(true)
    })
  })

  describe('formatSwapOrderItemsForHistory', () => {
    it('returns array of list items for history view', () => {
      const order = createMockOrder()
      const chain = createMockChain()

      const result = formatSwapOrderItemsForHistory(order, chain) as LabelValueItem[]

      expect(Array.isArray(result)).toBe(true)
      expect(result.some((item) => item.label === 'Order ID')).toBe(true)
      expect(result.some((item) => item.label === 'Network')).toBe(true)
      expect(result.some((item) => item.label === 'Status')).toBe(true)
    })
  })

  describe('formatTwapOrderItemsForHistory', () => {
    it('returns array of list items for TWAP order history', () => {
      const order = createMockOrder({
        numberOfParts: '4',
        partSellAmount: '250000000000000000',
        minPartLimit: '500000000',
        timeBetweenParts: 3600,
      }) as unknown as TwapOrderTransactionInfo
      const chain = createMockChain()

      const result = formatTwapOrderItemsForHistory(order, chain) as LabelValueItem[]

      expect(Array.isArray(result)).toBe(true)
      expect(result.some((item) => item.label === 'No of parts')).toBe(true)
      expect(result.some((item) => item.label === 'Sell amount')).toBe(true)
      expect(result.some((item) => item.label === 'Buy amount')).toBe(true)
    })
  })

  describe('formatTwapOrderItemsForConfirmation', () => {
    it('returns items with start time "Now" for AT_MINING_TIME', () => {
      const order = {
        numberOfParts: '4',
        partSellAmount: '250000000000000000',
        minPartLimit: '500000000',
        timeBetweenParts: '3600',
        sellToken: { decimals: 18, symbol: 'ETH' },
        buyToken: { decimals: 6, symbol: 'USDC' },
        startTime: { startType: StartTimeValue.AT_MINING_TIME },
      } as unknown as TwapOrderTransactionInfo

      const result = formatTwapOrderItemsForConfirmation(order)

      expect(Array.isArray(result)).toBe(true)
      const startTimeItem = result.find((item) => item.label === 'Start time')
      expect(startTimeItem?.value).toBe('Now')
    })

    it('returns items with epoch block number for AT_EPOCH', () => {
      const order = {
        numberOfParts: '4',
        partSellAmount: '250000000000000000',
        minPartLimit: '500000000',
        timeBetweenParts: '3600',
        sellToken: { decimals: 18, symbol: 'ETH' },
        buyToken: { decimals: 6, symbol: 'USDC' },
        startTime: { startType: StartTimeValue.AT_EPOCH, epoch: 12345678 },
      } as unknown as TwapOrderTransactionInfo

      const result = formatTwapOrderItemsForConfirmation(order)

      const startTimeItem = result.find((item) => item.label === 'Start time')
      expect(startTimeItem?.value).toContain('12345678')
    })

    it('includes part duration and total duration', () => {
      const order = {
        numberOfParts: '4',
        partSellAmount: '250000000000000000',
        minPartLimit: '500000000',
        timeBetweenParts: '3600',
        sellToken: { decimals: 18, symbol: 'ETH' },
        buyToken: { decimals: 6, symbol: 'USDC' },
        startTime: { startType: StartTimeValue.AT_MINING_TIME },
      } as unknown as TwapOrderTransactionInfo

      const result = formatTwapOrderItemsForConfirmation(order)

      expect(result.some((item) => item.label === 'Part duration')).toBe(true)
      expect(result.some((item) => item.label === 'Total duration')).toBe(true)
    })
  })
})

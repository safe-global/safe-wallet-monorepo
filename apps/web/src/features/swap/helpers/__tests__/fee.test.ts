import { calculateFeePercentageInBps, BASE_CHAIN_ID } from '@/features/swap/helpers/fee'
import { type OnTradeParamsPayload } from '@cowprotocol/events'
import { stableCoinAddresses } from '@/features/swap/helpers/data/stablecoins'

describe('calculateFeePercentageInBps', () => {
  it('returns correct fee for non-stablecoin and sell order', () => {
    let orderParams: OnTradeParamsPayload = {
      sellToken: { address: 'non-stablecoin-address' },
      buyToken: { address: 'non-stablecoin-address' },
      buyTokenFiatAmount: '50000',
      sellTokenFiatAmount: '50000',
      orderKind: 'sell',
    } as OnTradeParamsPayload

    const result = calculateFeePercentageInBps(orderParams)
    expect(result).toBe(35)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '100000',
      sellTokenFiatAmount: '100000',
    }

    const result2 = calculateFeePercentageInBps(orderParams)
    expect(result2).toBe(20)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '1000000',
      sellTokenFiatAmount: '1000000',
    }

    const result3 = calculateFeePercentageInBps(orderParams)
    expect(result3).toBe(10)
  })

  it('returns correct fee for non-stablecoin and buy order', () => {
    let orderParams: OnTradeParamsPayload = {
      sellToken: { address: 'non-stablecoin-address' },
      buyToken: { address: 'non-stablecoin-address' },
      buyTokenFiatAmount: '50000',
      sellTokenFiatAmount: '50000',
      orderKind: 'buy',
    } as OnTradeParamsPayload

    const result = calculateFeePercentageInBps(orderParams)
    expect(result).toBe(35)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '100000',
      sellTokenFiatAmount: '100000',
    }

    const result2 = calculateFeePercentageInBps(orderParams)
    expect(result2).toBe(20)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '1000000',
      sellTokenFiatAmount: '1000000',
    }

    const result3 = calculateFeePercentageInBps(orderParams)
    expect(result3).toBe(10)
  })

  it('returns correct fee for stablecoin and sell order', () => {
    const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
    let orderParams: OnTradeParamsPayload = {
      sellToken: { address: stableCoinAddressesKeys[0] },
      buyToken: { address: stableCoinAddressesKeys[1] },
      buyTokenFiatAmount: '50000',
      sellTokenFiatAmount: '50000',
      orderKind: 'sell',
    } as OnTradeParamsPayload

    const result = calculateFeePercentageInBps(orderParams)
    expect(result).toBe(10)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '100000',
      sellTokenFiatAmount: '100000',
    }

    const result2 = calculateFeePercentageInBps(orderParams)
    expect(result2).toBe(7)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '1000000',
      sellTokenFiatAmount: '1000000',
    }

    const result3 = calculateFeePercentageInBps(orderParams)
    expect(result3).toBe(5)
  })

  it('returns correct fee for stablecoin and buy order', () => {
    const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
    let orderParams: OnTradeParamsPayload = {
      sellToken: { address: stableCoinAddressesKeys[0] },
      buyToken: { address: stableCoinAddressesKeys[1] },
      buyTokenFiatAmount: '50000',
      sellTokenFiatAmount: '50000',
      orderKind: 'buy',
    } as OnTradeParamsPayload

    const result = calculateFeePercentageInBps(orderParams)
    expect(result).toBe(10)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '100000',
      sellTokenFiatAmount: '100000',
    }

    const result2 = calculateFeePercentageInBps(orderParams)
    expect(result2).toBe(7)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '1000000',
      sellTokenFiatAmount: '1000000',
    }

    const result3 = calculateFeePercentageInBps(orderParams)
    expect(result3).toBe(5)
  })

  describe('Base network fees', () => {
    it('returns 70 bps for regular tokens on Base network (0-100k)', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '50000',
        sellTokenFiatAmount: '50000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, BASE_CHAIN_ID)
      expect(result).toBe(70)
    })

    it('returns 20 bps for stablecoin pairs on Base network (0-100k)', () => {
      const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: stableCoinAddressesKeys[0] },
        buyToken: { address: stableCoinAddressesKeys[1] },
        buyTokenFiatAmount: '50000',
        sellTokenFiatAmount: '50000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, BASE_CHAIN_ID)
      expect(result).toBe(20)
    })

    it('returns standard fees for Base network above 100k', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '150000',
        sellTokenFiatAmount: '150000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, BASE_CHAIN_ID)
      expect(result).toBe(20) // Standard tier 2 fee
    })
  })
})

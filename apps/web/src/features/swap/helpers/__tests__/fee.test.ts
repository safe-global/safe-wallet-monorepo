import { calculateFeePercentageInBps } from '@/features/swap/helpers/fee'
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

  describe('V2 fees when nativeCowSwapFeeV2Enabled is true', () => {
    it('returns 70 bps for regular tokens (0-100k)', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '50000',
        sellTokenFiatAmount: '50000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(70)
    })

    it('returns 20 bps for stablecoin pairs (0-100k)', () => {
      const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: stableCoinAddressesKeys[0] },
        buyToken: { address: stableCoinAddressesKeys[1] },
        buyTokenFiatAmount: '50000',
        sellTokenFiatAmount: '50000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(20)
    })

    it('returns standard fees for V2 above 100k', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '150000',
        sellTokenFiatAmount: '150000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(20) // V2 tier 2 fee
    })
  })

  describe('Default parameter behavior', () => {
    it('uses default fees when second parameter is omitted', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '50000',
        sellTokenFiatAmount: '50000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams)
      expect(result).toBe(35) // Default regular tier 1 fee
    })

    it('uses default stable fees when second parameter is omitted', () => {
      const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: stableCoinAddressesKeys[0] },
        buyToken: { address: stableCoinAddressesKeys[1] },
        buyTokenFiatAmount: '50000',
        sellTokenFiatAmount: '50000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams)
      expect(result).toBe(10) // Default stable tier 1 fee
    })

    it('treats omitted parameter same as false', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '50000',
        sellTokenFiatAmount: '50000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const resultOmitted = calculateFeePercentageInBps(orderParams)
      const resultFalse = calculateFeePercentageInBps(orderParams, false)

      expect(resultOmitted).toBe(resultFalse)
      expect(resultOmitted).toBe(35) // Both should return default regular tier 1 fee
    })
  })
})

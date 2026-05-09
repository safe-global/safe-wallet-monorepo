import { calculateFeePercentageInBps } from '@/features/swap/helpers/fee'
import { type OnTradeParamsPayload } from '@cowprotocol/events'
import { stableCoinAddresses } from '@/features/swap/helpers/data/stablecoins'

describe('calculateFeePercentageInBps', () => {
  it('returns correct fee for non-stablecoin and sell order', () => {
    let orderParams: OnTradeParamsPayload = {
      sellToken: { address: 'non-stablecoin-address' },
      buyToken: { address: 'non-stablecoin-address' },
      buyTokenFiatAmount: '49999',
      sellTokenFiatAmount: '49999',
      orderKind: 'sell',
    } as OnTradeParamsPayload

    const result = calculateFeePercentageInBps(orderParams)
    expect(result).toBe(35)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '99999',
      sellTokenFiatAmount: '99999',
    }

    const result2 = calculateFeePercentageInBps(orderParams)
    expect(result2).toBe(35)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '999999',
      sellTokenFiatAmount: '999999',
    }

    const result3 = calculateFeePercentageInBps(orderParams)
    expect(result3).toBe(20)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '1000000',
      sellTokenFiatAmount: '1000000',
    }

    const result4 = calculateFeePercentageInBps(orderParams)
    expect(result4).toBe(10)
  })

  it('returns correct fee for non-stablecoin and buy order', () => {
    let orderParams: OnTradeParamsPayload = {
      sellToken: { address: 'non-stablecoin-address' },
      buyToken: { address: 'non-stablecoin-address' },
      buyTokenFiatAmount: '49999',
      sellTokenFiatAmount: '49999',
      orderKind: 'buy',
    } as OnTradeParamsPayload

    const result = calculateFeePercentageInBps(orderParams)
    expect(result).toBe(35)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '99999',
      sellTokenFiatAmount: '99999',
    }

    const result2 = calculateFeePercentageInBps(orderParams)
    expect(result2).toBe(35)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '999999',
      sellTokenFiatAmount: '999999',
    }

    const result3 = calculateFeePercentageInBps(orderParams)
    expect(result3).toBe(20)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '1000000',
      sellTokenFiatAmount: '1000000',
    }

    const result4 = calculateFeePercentageInBps(orderParams)
    expect(result4).toBe(10)
  })

  it('returns correct fee for stablecoin and sell order', () => {
    const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
    let orderParams: OnTradeParamsPayload = {
      sellToken: { address: stableCoinAddressesKeys[0] },
      buyToken: { address: stableCoinAddressesKeys[1] },
      buyTokenFiatAmount: '49999',
      sellTokenFiatAmount: '49999',
      orderKind: 'sell',
    } as OnTradeParamsPayload

    const result = calculateFeePercentageInBps(orderParams)
    expect(result).toBe(10)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '99999',
      sellTokenFiatAmount: '99999',
    }

    const result2 = calculateFeePercentageInBps(orderParams)
    expect(result2).toBe(10)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '999999',
      sellTokenFiatAmount: '999999',
    }

    const result3 = calculateFeePercentageInBps(orderParams)
    expect(result3).toBe(7)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '1000000',
      sellTokenFiatAmount: '1000000',
    }

    const result4 = calculateFeePercentageInBps(orderParams)
    expect(result4).toBe(5)
  })

  it('returns correct fee for stablecoin and buy order', () => {
    const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
    let orderParams: OnTradeParamsPayload = {
      sellToken: { address: stableCoinAddressesKeys[0] },
      buyToken: { address: stableCoinAddressesKeys[1] },
      buyTokenFiatAmount: '49999',
      sellTokenFiatAmount: '49999',
      orderKind: 'buy',
    } as OnTradeParamsPayload

    const result = calculateFeePercentageInBps(orderParams)
    expect(result).toBe(10)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '99999',
      sellTokenFiatAmount: '99999',
    }

    const result2 = calculateFeePercentageInBps(orderParams)
    expect(result2).toBe(10)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '999999',
      sellTokenFiatAmount: '999999',
    }

    const result3 = calculateFeePercentageInBps(orderParams)
    expect(result3).toBe(7)

    orderParams = {
      ...orderParams,
      buyTokenFiatAmount: '1000000',
      sellTokenFiatAmount: '1000000',
    }

    const result4 = calculateFeePercentageInBps(orderParams)
    expect(result4).toBe(5)
  })

  describe('V2 fees when nativeCowSwapFeeV2Enabled is true', () => {
    it('returns 70 bps for regular tokens (0-50k)', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '49999',
        sellTokenFiatAmount: '49999',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(70)
    })

    it('returns 35 bps for regular tokens (50k-100k)', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '99999',
        sellTokenFiatAmount: '99999',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(35)
    })

    it('returns 20 bps for regular tokens (100k-1M)', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '999999',
        sellTokenFiatAmount: '999999',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(20)
    })

    it('returns 10 bps for regular tokens (>1M)', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '1000000',
        sellTokenFiatAmount: '1000000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(10)
    })

    it('returns 15 bps for stablecoin pairs (0-50k)', () => {
      const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: stableCoinAddressesKeys[0] },
        buyToken: { address: stableCoinAddressesKeys[1] },
        buyTokenFiatAmount: '49999',
        sellTokenFiatAmount: '49999',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(15)
    })

    it('returns 10 bps for stablecoin pairs (50k-100k)', () => {
      const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: stableCoinAddressesKeys[0] },
        buyToken: { address: stableCoinAddressesKeys[1] },
        buyTokenFiatAmount: '99999',
        sellTokenFiatAmount: '99999',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(10)
    })

    it('returns 7 bps for stablecoin pairs (100k-1M)', () => {
      const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: stableCoinAddressesKeys[0] },
        buyToken: { address: stableCoinAddressesKeys[1] },
        buyTokenFiatAmount: '999999',
        sellTokenFiatAmount: '999999',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(7)
    })

    it('returns 5 bps for stablecoin pairs (>1M)', () => {
      const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: stableCoinAddressesKeys[0] },
        buyToken: { address: stableCoinAddressesKeys[1] },
        buyTokenFiatAmount: '1000000',
        sellTokenFiatAmount: '1000000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams, true)
      expect(result).toBe(5)
    })
  })

  describe('Default parameter behavior', () => {
    it('uses default fees when second parameter is omitted', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '49999',
        sellTokenFiatAmount: '49999',
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
        buyTokenFiatAmount: '49999',
        sellTokenFiatAmount: '49999',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const result = calculateFeePercentageInBps(orderParams)
      expect(result).toBe(10) // Default stable tier 1 fee
    })

    it('treats omitted parameter same as false', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'non-stablecoin-address' },
        buyToken: { address: 'non-stablecoin-address' },
        buyTokenFiatAmount: '49999',
        sellTokenFiatAmount: '49999',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const resultOmitted = calculateFeePercentageInBps(orderParams)
      const resultFalse = calculateFeePercentageInBps(orderParams, false)

      expect(resultOmitted).toBe(resultFalse)
      expect(resultOmitted).toBe(35) // Both should return default regular tier 1 fee
    })
  })

  describe('EURCV boost zero fee', () => {
    const EURCV_ADDRESS = '0x5f7827fdeb7c20b443265fc2f40845b715385ff2'

    it('returns 0 fee when buyToken is EURCV and isEurcvBoostEnabled is true', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'any-token-address' },
        buyToken: { address: EURCV_ADDRESS },
        sellTokenFiatAmount: '1000',
        buyTokenFiatAmount: '1000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      // Should return 0 regardless of V2 flag when EURCV boost is enabled
      expect(calculateFeePercentageInBps(orderParams, false, true)).toBe(0)
      expect(calculateFeePercentageInBps(orderParams, true, true)).toBe(0)
    })

    it('returns normal fee when buyToken is EURCV but isEurcvBoostEnabled is false', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: 'any-token-address' },
        buyToken: { address: EURCV_ADDRESS },
        sellTokenFiatAmount: '1000',
        buyTokenFiatAmount: '1000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      // EURCV is now a stablecoin, but only one token is EURCV so normal fees apply
      expect(calculateFeePercentageInBps(orderParams, false, false)).toBe(35)
      expect(calculateFeePercentageInBps(orderParams, true, false)).toBe(70)
    })

    it('returns normal fee when sellToken is EURCV (not buyToken)', () => {
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: EURCV_ADDRESS },
        buyToken: { address: 'any-token-address' },
        sellTokenFiatAmount: '1000',
        buyTokenFiatAmount: '1000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      // Zero fee only applies when BUYING EURCV, not selling
      expect(calculateFeePercentageInBps(orderParams, false, true)).toBe(35)
      expect(calculateFeePercentageInBps(orderParams, true, true)).toBe(70)
    })

    it('handles case-insensitive EURCV address comparison', () => {
      const orderParamsUpperCase: OnTradeParamsPayload = {
        sellToken: { address: 'any-token-address' },
        buyToken: { address: EURCV_ADDRESS.toUpperCase() },
        sellTokenFiatAmount: '1000',
        buyTokenFiatAmount: '1000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      const orderParamsMixedCase: OnTradeParamsPayload = {
        sellToken: { address: 'any-token-address' },
        buyToken: { address: '0x5F7827FDeb7c20b443265fc2f40845b715385FF2' },
        sellTokenFiatAmount: '1000',
        buyTokenFiatAmount: '1000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      expect(calculateFeePercentageInBps(orderParamsUpperCase, false, true)).toBe(0)
      expect(calculateFeePercentageInBps(orderParamsMixedCase, false, true)).toBe(0)
    })

    it('returns stablecoin fees when both tokens are stablecoins including EURCV (boost disabled)', () => {
      const stableCoinAddressesKeys = Object.keys(stableCoinAddresses)
      const orderParams: OnTradeParamsPayload = {
        sellToken: { address: stableCoinAddressesKeys[0] },
        buyToken: { address: EURCV_ADDRESS },
        sellTokenFiatAmount: '1000',
        buyTokenFiatAmount: '1000',
        orderKind: 'sell',
      } as OnTradeParamsPayload

      // Both tokens are stablecoins, so stablecoin fees apply
      expect(calculateFeePercentageInBps(orderParams, false, false)).toBe(10)
      expect(calculateFeePercentageInBps(orderParams, true, false)).toBe(15)
    })
  })
})

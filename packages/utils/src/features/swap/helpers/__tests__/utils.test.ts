import {
  getExecutionPrice,
  getFilledPercentage,
  getLimitPrice,
  getPartiallyFilledSurplus,
  getSurplusPrice,
  isOrderPartiallyFilled,
  isSettingTwapFallbackHandler,
  TWAP_FALLBACK_HANDLER,
  getOrderFeeBps,
} from '../utils'
import type {
  DataDecoded,
  TwapOrderTransactionInfo as TwapOrder,
  SwapOrderTransactionInfo as SwapOrder,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('Swap helpers', () => {
  test('sellAmount bigger than buyAmount', () => {
    const mockOrder = {
      executedSellAmount: '100000000000000000000', // 100 tokens
      executedBuyAmount: '50000000000000000000', // 50 tokens
      buyToken: { decimals: 18 },
      sellToken: { decimals: 18 },
      sellAmount: '100000000000000000000',
      buyAmount: '50000000000000000000',
    } as unknown as SwapOrder

    const executionPrice = getExecutionPrice(mockOrder)
    const limitPrice = getLimitPrice(mockOrder)
    const surplusPrice = getSurplusPrice(mockOrder)

    expect(executionPrice).toBe(2)
    expect(limitPrice).toBe(2)
    expect(surplusPrice).toBe(0)
  })

  test('sellAmount smaller than buyAmount', () => {
    const mockOrder = {
      executedSellAmount: '50000000000000000000', // 50 tokens
      executedBuyAmount: '100000000000000000000', // 100 tokens
      buyToken: { decimals: 18 },
      sellToken: { decimals: 18 },
      sellAmount: '50000000000000000000',
      buyAmount: '100000000000000000000',
    } as unknown as SwapOrder

    const executionPrice = getExecutionPrice(mockOrder)
    const limitPrice = getLimitPrice(mockOrder)
    const surplusPrice = getSurplusPrice(mockOrder)

    expect(executionPrice).toBe(0.5)
    expect(limitPrice).toBe(0.5)
    expect(surplusPrice).toBe(0)
  })

  test('buyToken has more decimals than sellToken', () => {
    const mockOrder = {
      executedSellAmount: '10000000000', // 100 tokens
      executedBuyAmount: '50000000000000000000', // 50 tokens
      buyToken: { decimals: 18 },
      sellToken: { decimals: 8 },
      sellAmount: '10000000000',
      buyAmount: '50000000000000000000',
    } as unknown as SwapOrder

    const executionPrice = getExecutionPrice(mockOrder)
    const limitPrice = getLimitPrice(mockOrder)
    const surplusPrice = getSurplusPrice(mockOrder)

    expect(executionPrice).toBe(2)
    expect(limitPrice).toBe(2)
    expect(surplusPrice).toBe(0)
  })

  test('sellToken has more decimals than buyToken', () => {
    const mockOrder = {
      executedSellAmount: '100000000000000000000', // 100 tokens
      executedBuyAmount: '5000000000', // 50 tokens
      buyToken: { decimals: 8 },
      sellToken: { decimals: 18 },
      sellAmount: '100000000000000000000',
      buyAmount: '5000000000',
    } as unknown as SwapOrder

    const executionPrice = getExecutionPrice(mockOrder)
    const limitPrice = getLimitPrice(mockOrder)
    const surplusPrice = getSurplusPrice(mockOrder)

    expect(executionPrice).toBe(2)
    expect(limitPrice).toBe(2)
    expect(surplusPrice).toBe(0)
  })

  test('twap order with unknown executed sell and buy amounts', () => {
    const mockOrder = {
      executedSellAmount: null,
      executedBuyAmount: null,
      buyToken: { decimals: 8 },
      sellToken: { decimals: 18 },
      sellAmount: '100000000000000000000',
      buyAmount: '5000000000',
    } as unknown as TwapOrder

    const executionPrice = getExecutionPrice(mockOrder)
    const limitPrice = getLimitPrice(mockOrder)
    const surplusPrice = getSurplusPrice(mockOrder)

    expect(executionPrice).toBe(0)
    expect(limitPrice).toBe(2)
    expect(surplusPrice).toBe(0)
  })

  describe('getFilledPercentage', () => {
    it('returns 0 if no amount was executed', () => {
      const mockOrder = {
        executedSellAmount: '0',
        executedBuyAmount: '0',
        buyToken: { decimals: 8 },
        sellToken: { decimals: 18 },
        sellAmount: '100000000000000000000',
        buyAmount: '5000000000',
      } as unknown as SwapOrder

      const result = getFilledPercentage(mockOrder)

      expect(result).toEqual('0')
    })

    it('returns the percentage for buy orders', () => {
      const mockOrder = {
        executedSellAmount: '10000000000000000000',
        executedBuyAmount: '50000000',
        buyToken: { decimals: 8 },
        sellToken: { decimals: 18 },
        sellAmount: '100000000000000000000',
        buyAmount: '5000000000',
        kind: 'buy',
      } as unknown as SwapOrder

      const result = getFilledPercentage(mockOrder)

      expect(result).toEqual('1')
    })

    it('returns the percentage for sell orders', () => {
      const mockOrder = {
        executedSellAmount: '10000000000000000000',
        executedBuyAmount: '50000000',
        buyToken: { decimals: 8 },
        sellToken: { decimals: 18 },
        sellAmount: '100000000000000000000',
        buyAmount: '5000000000',
        kind: 'sell',
      } as unknown as SwapOrder

      const result = getFilledPercentage(mockOrder)

      expect(result).toEqual('10')
    })

    it('returns 0 if the executed amount is below 1%', () => {
      const mockOrder = {
        executedSellAmount: '10000000000000000000',
        executedBuyAmount: '50',
        buyToken: { decimals: 8 },
        sellToken: { decimals: 18 },
        sellAmount: '100000000000000000000',
        buyAmount: '5000000000',
        kind: 'buy',
      } as unknown as SwapOrder

      const result = getFilledPercentage(mockOrder)

      expect(result).toEqual('0')
    })

    it('returns the surplus amount for buy orders', () => {
      const mockOrder = {
        executedSellAmount: '10000000000000000000', //10
        executedBuyAmount: '50',
        buyToken: { decimals: 8 },
        sellToken: { decimals: 18 },
        sellAmount: '15000000000000000000', //15
        buyAmount: '5000000000',
        kind: 'buy',
      } as unknown as SwapOrder

      const result = getSurplusPrice(mockOrder)

      expect(result).toEqual(5)
    })

    it('returns the surplus amount for sell orders', () => {
      const mockOrder = {
        executedSellAmount: '100000000000000000000',
        executedBuyAmount: '10000000000', //100
        buyToken: { decimals: 8 },
        sellToken: { decimals: 18 },
        sellAmount: '100000000000000000000',
        buyAmount: '5000000000', //50
        kind: 'sell',
      } as unknown as SwapOrder

      const result = getSurplusPrice(mockOrder)

      expect(result).toEqual(50)
    })
  })

  describe('isOrderPartiallyFilled', () => {
    it('returns true if a buy order is partially filled', () => {
      const mockOrder = {
        executedBuyAmount: '10',
        buyAmount: '100000000000000000000', // 100 tokens
        executedSellAmount: '50000000000000000000', // 50 tokens
        sellAmount: '100000000000000000000', // 100 tokens
        kind: 'buy',
      } as unknown as SwapOrder

      const result = isOrderPartiallyFilled(mockOrder)

      expect(result).toBe(true)
    })

    it('returns false if a buy order is not fully filled or fully filled', () => {
      const mockOrder = {
        executedBuyAmount: '0',
        buyAmount: '100000000000000000000', // 100 tokens
        executedSellAmount: '100000000000000000000', // 100 tokens
        sellAmount: '100000000000000000000', // 100 tokens
        kind: 'buy',
      } as unknown as SwapOrder

      const result = isOrderPartiallyFilled(mockOrder)

      expect(result).toBe(false)

      const result1 = isOrderPartiallyFilled({
        ...mockOrder,
        executedBuyAmount: '100000000000000000000', // 100 tokens
      })
      expect(result1).toBe(false)
    })

    it('returns true if a sell order is partially filled', () => {
      const mockOrder = {
        sellAmount: '100000000000000000000',
        executedSellAmount: '10',
        executedBuyAmount: '50000000000000000000', // 50 tokens
        buyAmount: '100000000000000000000', // 100 tokens
        kind: 'sell',
      } as unknown as SwapOrder

      const result = isOrderPartiallyFilled(mockOrder)

      expect(result).toBe(true)
    })

    it('returns false if a sell order is not fully filled or fully filled', () => {
      const mockOrder = {
        sellAmount: '100000000000000000000',
        executedSellAmount: '0',
        executedBuyAmount: '100000000000000000000', // 100 tokens
        buyAmount: '100000000000000000000', // 100 tokens
        kind: 'sell',
      } as unknown as SwapOrder

      const result = isOrderPartiallyFilled(mockOrder)

      expect(result).toBe(false)

      const result1 = isOrderPartiallyFilled({
        ...mockOrder,
        executedSellAmount: '100000000000000000000', // 100 tokens
      })

      expect(result1).toBe(false)
    })
  })
  describe('getPartiallyFilledSurplusPrice', () => {
    it('returns 0 for partially filled sell order with no surplus', () => {
      const mockOrder = {
        sellAmount: '100000000000000000000', // 100 tokens
        executedSellAmount: '50000000000000000000', // 50 tokens
        executedBuyAmount: '50000000000000000000', // 50 tokens
        buyAmount: '100000000000000000000', // 100 tokens
        kind: 'sell',
        buyToken: { decimals: 18 },
        sellToken: { decimals: 18 },
      } as unknown as SwapOrder

      const result = getPartiallyFilledSurplus(mockOrder)

      expect(result).toEqual(0)
    })
    it('returns 0 for partially filled buy order with no surplus', () => {
      const mockOrder = {
        sellAmount: '100000000000000000000', // 100 tokens
        executedSellAmount: '50000000000000000000', // 50 tokens
        executedBuyAmount: '50000000000000000000', // 50 tokens
        buyAmount: '100000000000000000000', // 100 tokens
        kind: 'buy',
        buyToken: { decimals: 18 },
        sellToken: { decimals: 18 },
      } as unknown as SwapOrder

      const result = getPartiallyFilledSurplus(mockOrder)

      expect(result).toEqual(0)
    })
    it('returns surplus for partially filled sell orders', () => {
      const mockOrder = {
        sellAmount: '100000000000000000000', // 100 tokens
        executedSellAmount: '50000000000000000000', // 50 tokens
        executedBuyAmount: '55000000000000000000', // 55 tokens
        buyAmount: '100000000000000000000', // 100 tokens
        kind: 'sell',
        buyToken: { decimals: 18 },
        sellToken: { decimals: 18 },
      } as unknown as SwapOrder

      const result = getPartiallyFilledSurplus(mockOrder)
      expect(result).toEqual(5)
    })
    it('returns surplus for partially filled buy orders', () => {
      const mockOrder = {
        sellAmount: '100000000000000000000', // 100 tokens
        executedSellAmount: '45000000000000000000', // 50 tokens
        executedBuyAmount: '50000000000000000000', // 55 tokens
        buyAmount: '100000000000000000000', // 100 tokens
        kind: 'buy',
        buyToken: { decimals: 18 },
        sellToken: { decimals: 18 },
      } as unknown as SwapOrder

      const result = getPartiallyFilledSurplus(mockOrder)

      expect(result).toEqual(5)
    })
  })

  describe('isSettingTwapFallbackHandler', () => {
    it('should return true when handler is TWAP_FALLBACK_HANDLER', () => {
      const decodedData = {
        parameters: [
          {
            valueDecoded: [
              {
                dataDecoded: {
                  method: 'setFallbackHandler',
                  parameters: [{ name: 'handler', value: TWAP_FALLBACK_HANDLER }],
                },
              },
            ],
          },
        ],
      } as unknown as DataDecoded
      expect(isSettingTwapFallbackHandler(decodedData)).toBe(true)
    })

    it('should return false when handler is not TWAP_FALLBACK_HANDLER', () => {
      const decodedData = {
        parameters: [
          {
            valueDecoded: [
              {
                dataDecoded: {
                  method: 'setFallbackHandler',
                  parameters: [{ name: 'handler', value: '0xDifferentHandler' }],
                },
              },
            ],
          },
        ],
      } as unknown as DataDecoded
      expect(isSettingTwapFallbackHandler(decodedData)).toBe(false)
    })

    it('should return false when method is not setFallbackHandler', () => {
      const decodedData = {
        parameters: [
          {
            valueDecoded: [
              {
                dataDecoded: {
                  method: 'differentMethod',
                  parameters: [{ name: 'handler', value: TWAP_FALLBACK_HANDLER }],
                },
              },
            ],
          },
        ],
      } as unknown as DataDecoded
      expect(isSettingTwapFallbackHandler(decodedData)).toBe(false)
    })

    it('should return false when parameters are missing', () => {
      const decodedData = {} as unknown as DataDecoded
      expect(isSettingTwapFallbackHandler(decodedData)).toBe(false)
    })

    it('should return false when valueDecoded is missing', () => {
      const decodedData = {
        parameters: [
          {
            valueDecoded: null,
          },
        ],
      } as unknown as DataDecoded
      expect(isSettingTwapFallbackHandler(decodedData)).toBe(false)
    })

    it('should return false when dataDecoded is missing', () => {
      const decodedData = {
        parameters: [
          {
            valueDecoded: [
              {
                dataDecoded: null,
              },
            ],
          },
        ],
      } as unknown as DataDecoded
      expect(isSettingTwapFallbackHandler(decodedData)).toBe(false)
    })
  })

  describe('getOrderFeeBps', () => {
    describe('undefined partnerFee cases', () => {
      it('should return 0 when fullAppData is null', () => {
        const mockOrder = {
          fullAppData: null,
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })

      it('should return 0 when fullAppData is undefined', () => {
        const mockOrder = {
          fullAppData: undefined,
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })

      it('should return 0 when metadata is missing', () => {
        const mockOrder = {
          fullAppData: {},
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })

      it('should return 0 when metadata is null', () => {
        const mockOrder = {
          fullAppData: {
            metadata: null,
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })

      it('should return 0 when partnerFee is undefined', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: undefined,
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })

      it('should return 0 when partnerFee is null', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: null,
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })
    })

    describe('legacy partnerFee format (v1.3.0)', () => {
      it('should return bps value for valid legacy partnerFee', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: {
                bps: 25,
                recipient: '0x1234567890123456789012345678901234567890',
              },
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(25)
      })

      it('should return 0 when legacy partnerFee has no bps property', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: {
                recipient: '0x1234567890123456789012345678901234567890',
              },
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })

      it('should return 0 when legacy partnerFee bps is not a number', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: {
                bps: 'invalid',
                recipient: '0x1234567890123456789012345678901234567890',
              },
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })
    })

    describe('modern partnerFee format (v1.4.0)', () => {
      it('should return volumeBps for volume fee', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: {
                volumeBps: 30,
                recipient: '0x1234567890123456789012345678901234567890',
              },
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(30)
      })

      it('should return 0 for surplus fee (not volume fee)', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: {
                surplusBps: 25,
                maxVolumeBps: 50,
                recipient: '0x1234567890123456789012345678901234567890',
              },
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })

      it('should return 0 for price improvement fee (not volume fee)', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: {
                priceImprovementBps: 15,
                maxVolumeBps: 40,
                recipient: '0x1234567890123456789012345678901234567890',
              },
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })

      it('should sum volumeBps from array of fees', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: [
                {
                  volumeBps: 20,
                  recipient: '0x1234567890123456789012345678901234567890',
                },
                {
                  volumeBps: 15,
                  recipient: '0x0987654321098765432109876543210987654321',
                },
                {
                  surplusBps: 10, // This should be ignored
                  maxVolumeBps: 30,
                  recipient: '0x1111111111111111111111111111111111111111',
                },
              ],
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(35) // 20 + 15, surplus fee ignored
      })

      it('should return 0 for array with no volume fees', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: [
                {
                  surplusBps: 25,
                  maxVolumeBps: 50,
                  recipient: '0x1234567890123456789012345678901234567890',
                },
                {
                  priceImprovementBps: 15,
                  maxVolumeBps: 40,
                  recipient: '0x0987654321098765432109876543210987654321',
                },
              ],
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })

      it('should return 0 for empty array', () => {
        const mockOrder = {
          fullAppData: {
            metadata: {
              partnerFee: [],
            },
          },
        } as unknown as SwapOrder

        const result = getOrderFeeBps(mockOrder)
        expect(result).toBe(0)
      })
    })
  })
})

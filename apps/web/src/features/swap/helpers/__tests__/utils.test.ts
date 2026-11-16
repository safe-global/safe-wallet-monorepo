import type { SwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { DataDecoded, TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { OnTradeParamsPayload } from '@cowprotocol/events'
import { UiOrderType } from '@safe-global/utils/features/swap/types'
import { faker } from '@faker-js/faker'
import { Interface, getAddress } from 'ethers'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType, type MetaTransactionData } from '@safe-global/types-kit'
import { ERC20__factory, Multi_send__factory } from '@safe-global/utils/types/contracts'
import {
  COW_DEPLOYMENTS,
  countNonSwapOrderCalls,
  getExecutionPrice,
  getFilledPercentage,
  getLimitPrice,
  getPartiallyFilledSurplus,
  getSurplusPrice,
  isOrderPartiallyFilled,
  isSettingTwapFallbackHandler,
  parseCowTradeParams,
  TWAP_FALLBACK_HANDLER,
} from '../utils'

describe('Swap helpers', () => {
  test('sellAmount bigger than buyAmount', () => {
    const mockOrder = {
      executedSellAmount: '100000000000000000000', // 100 tokens
      executedBuyAmount: '50000000000000000000', // 50 tokens
      buyToken: { decimals: 18 },
      sellToken: { decimals: 18 },
      sellAmount: '100000000000000000000',
      buyAmount: '50000000000000000000',
    } as unknown as SwapOrderTransactionInfo

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
    } as unknown as SwapOrderTransactionInfo

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
    } as unknown as SwapOrderTransactionInfo

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
    } as unknown as SwapOrderTransactionInfo

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
    } as unknown as TwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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
      } as unknown as SwapOrderTransactionInfo

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

  describe('parseCowTradeParams', () => {
    const makePayload = (params: Record<string, unknown>) =>
      ({ orderType: 'SWAP', ...params }) as unknown as OnTradeParamsPayload

    it('maps known CoW order types to the local UiOrderType', () => {
      expect(parseCowTradeParams(makePayload({ orderType: 'SWAP' })).uiOrderType).toBe(UiOrderType.SWAP)
      expect(parseCowTradeParams(makePayload({ orderType: 'LIMIT' })).uiOrderType).toBe(UiOrderType.LIMIT)
      expect(parseCowTradeParams(makePayload({ orderType: 'TWAP' })).uiOrderType).toBe(UiOrderType.TWAP)
    })

    it('does not silently reset LIMIT/TWAP to SWAP', () => {
      expect(parseCowTradeParams(makePayload({ orderType: 'LIMIT' })).uiOrderType).not.toBe(UiOrderType.SWAP)
      expect(parseCowTradeParams(makePayload({ orderType: 'TWAP' })).uiOrderType).not.toBe(UiOrderType.SWAP)
    })

    it('falls back to SWAP for order types we do not model (HOOKS, YIELD, unknown)', () => {
      expect(parseCowTradeParams(makePayload({ orderType: 'HOOKS' })).uiOrderType).toBe(UiOrderType.SWAP)
      expect(parseCowTradeParams(makePayload({ orderType: 'YIELD' })).uiOrderType).toBe(UiOrderType.SWAP)
      expect(parseCowTradeParams(makePayload({ orderType: 'SOMETHING_NEW' })).uiOrderType).toBe(UiOrderType.SWAP)
    })

    it('extracts sell/buy token addresses', () => {
      const result = parseCowTradeParams(
        makePayload({ sellToken: { address: '0xSell' }, buyToken: { address: '0xBuy' } }),
      )
      expect(result.sellAsset).toBe('0xSell')
      expect(result.buyAsset).toBe('0xBuy')
    })

    it('normalizes missing tokens/addresses to an empty string rather than undefined', () => {
      expect(parseCowTradeParams(makePayload({})).sellAsset).toBe('')
      expect(parseCowTradeParams(makePayload({})).buyAsset).toBe('')
      expect(parseCowTradeParams(makePayload({ sellToken: {} })).sellAsset).toBe('')
    })
  })

  describe('countNonSwapOrderCalls', () => {
    const ERC20_INTERFACE = ERC20__factory.createInterface()
    const MULTISEND_INTERFACE = Multi_send__factory.createInterface()
    const SETTLEMENT_INTERFACE = new Interface(['function setPreSignature(bytes orderUid, bool signed)'])
    const WETH_INTERFACE = new Interface(['function deposit()'])
    const [
      { settlement: SETTLEMENT, vaultRelayer: VAULT_RELAYER },
      { settlement: STAGING_SETTLEMENT, vaultRelayer: STAGING_VAULT_RELAYER },
    ] = COW_DEPLOYMENTS

    const randomAddress = () => getAddress(faker.finance.ethereumAddress())
    const randomAmount = () => faker.number.bigInt({ min: 1n, max: 10n ** 18n }).toString()
    const randomUid = () => faker.string.hexadecimal({ length: 112, casing: 'lower' })

    const order = {
      uid: randomUid(),
      sellToken: { address: randomAddress() },
      sellAmount: randomAmount(),
    } as SwapOrderTransactionInfo

    const presign = (overrides: Partial<MetaTransactionData> = {}, uid = order.uid, signed = true) => ({
      to: SETTLEMENT,
      value: '0',
      data: SETTLEMENT_INTERFACE.encodeFunctionData('setPreSignature', [uid, signed]),
      operation: OperationType.Call,
      ...overrides,
    })
    const approve = (token = order.sellToken.address, spender = VAULT_RELAYER): MetaTransactionData => ({
      to: token,
      value: '0',
      data: ERC20_INTERFACE.encodeFunctionData('approve', [spender, randomAmount()]),
      operation: OperationType.Call,
    })
    const wrap = (to = order.sellToken.address, value = order.sellAmount): MetaTransactionData => ({
      to,
      value,
      data: WETH_INTERFACE.encodeFunctionData('deposit'),
      operation: OperationType.Call,
    })
    const erc20Transfer = (): MetaTransactionData => ({
      to: order.sellToken.address,
      value: '0',
      data: ERC20_INTERFACE.encodeFunctionData('transfer', [randomAddress(), randomAmount()]),
      operation: OperationType.Call,
    })
    const nativeTransfer = (): MetaTransactionData => ({
      to: randomAddress(),
      value: randomAmount(),
      data: '0x',
      operation: OperationType.Call,
    })

    const singleCall = (call: MetaTransactionData) => ({
      to: { value: call.to },
      value: call.value,
      hexData: call.data,
      operation: call.operation ?? OperationType.Call,
      trustedDelegateCallTarget: null,
    })
    const batch = (calls: MetaTransactionData[], overrides = {}) => ({
      to: { value: randomAddress() },
      value: '0',
      hexData: MULTISEND_INTERFACE.encodeFunctionData('multiSend', [encodeMultiSendData(calls)]),
      operation: OperationType.DelegateCall,
      trustedDelegateCallTarget: true,
      ...overrides,
    })

    it('returns 0 for the presignature of the order sent to the settlement contract', () => {
      expect(countNonSwapOrderCalls(singleCall(presign()), order)).toBe(0)
    })

    it('returns 0 for a batch of sell token approval to the VaultRelayer and presignature', () => {
      expect(countNonSwapOrderCalls(batch([approve(), presign()]), order)).toBe(0)
    })

    it('returns 0 for a batch that wraps the sell amount, approves and presigns', () => {
      expect(countNonSwapOrderCalls(batch([wrap(), approve(), presign()]), order)).toBe(0)
    })

    it('returns 0 for an order made against the staging contracts', () => {
      const calls = [approve(order.sellToken.address, STAGING_VAULT_RELAYER), presign({ to: STAGING_SETTLEMENT })]
      expect(countNonSwapOrderCalls(batch(calls), order)).toBe(0)
    })

    it('counts an approval to the VaultRelayer of the other CoW deployment', () => {
      const calls = [approve(order.sellToken.address, STAGING_VAULT_RELAYER), presign()]
      expect(countNonSwapOrderCalls(batch(calls), order)).toBe(1)
    })

    it('counts an approval to the VaultRelayer when the batch has no presignature of the order', () => {
      expect(countNonSwapOrderCalls(batch([approve(), presign({}, randomUid())]), order)).toBe(2)
    })

    it('returns 0 when there is no transaction data', () => {
      expect(countNonSwapOrderCalls({ ...singleCall(presign()), hexData: undefined }, order)).toBe(0)
    })

    it('counts token and native transfers batched with the order', () => {
      expect(countNonSwapOrderCalls(batch([erc20Transfer(), nativeTransfer(), presign()]), order)).toBe(2)
    })

    it('counts the presignature of another order', () => {
      expect(countNonSwapOrderCalls(batch([presign(), presign({}, randomUid())]), order)).toBe(1)
    })

    it('counts the cancellation of a presignature', () => {
      expect(countNonSwapOrderCalls(batch([presign(), presign({}, order.uid, false)]), order)).toBe(1)
    })

    it('counts an approval to a spender other than the VaultRelayer', () => {
      expect(countNonSwapOrderCalls(batch([approve(order.sellToken.address, randomAddress()), presign()]), order)).toBe(
        1,
      )
    })

    it('counts an approval of a token other than the sell token', () => {
      expect(countNonSwapOrderCalls(batch([approve(randomAddress()), presign()]), order)).toBe(1)
    })

    it('counts a wrap sent to an address other than the sell token', () => {
      expect(countNonSwapOrderCalls(batch([wrap(randomAddress()), presign()]), order)).toBe(1)
    })

    it('counts a wrap of more than the sell amount', () => {
      const value = (BigInt(order.sellAmount) + 1n).toString()
      expect(countNonSwapOrderCalls(batch([wrap(order.sellToken.address, value), presign()]), order)).toBe(1)
    })

    it('counts a presignature sent to an address other than the settlement contract', () => {
      expect(countNonSwapOrderCalls(singleCall(presign({ to: randomAddress() })), order)).toBe(1)
    })

    it('counts a presignature that sends value', () => {
      expect(countNonSwapOrderCalls(singleCall(presign({ value: randomAmount() })), order)).toBe(1)
    })

    it('counts a presignature made with a delegate call', () => {
      expect(countNonSwapOrderCalls(batch([presign({ operation: OperationType.DelegateCall })]), order)).toBe(1)
    })

    it('counts a batch sent to an untrusted delegate call target as one call', () => {
      expect(countNonSwapOrderCalls(batch([presign()], { trustedDelegateCallTarget: false }), order)).toBe(1)
    })

    it('counts a batch that is not a delegate call as one call', () => {
      const calls = [presign()]
      expect(
        countNonSwapOrderCalls(batch(calls, { operation: OperationType.Call, trustedDelegateCallTarget: null }), order),
      ).toBe(1)
    })
  })
})

import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'

import { withoutFees, computeTotalOutgoing, getSendInGasToken, ERC20_INTERFACE } from '../totalOutgoing'
import { createSafeTx } from '@/tests/builders/safeTx'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const RECIPIENT = '0x1111111111111111111111111111111111111111'

const encodeTransfer = (to: string, amount: bigint) =>
  ERC20_INTERFACE.encodeFunctionData('transfer', [to, amount]) as `0x${string}`

const buildBalances = (): Balances =>
  ({
    items: [
      {
        tokenInfo: { type: 'NATIVE_TOKEN', address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18, logoUri: '' },
        balance: '1000000000000000000',
        fiatConversion: '2000',
        fiatBalance: '2000',
      },
      {
        tokenInfo: { type: 'ERC20', address: USDC, symbol: 'USDC', decimals: 6, logoUri: '' },
        balance: '1000000000',
        fiatConversion: '1',
        fiatBalance: '1000',
      },
    ],
  }) as unknown as Balances

describe('getSendInGasToken', () => {
  it('returns native value when gas token is native and tx is a plain transfer', () => {
    const safeTx = createSafeTx()
    safeTx.data.value = '500000000000000000'
    safeTx.data.data = '0x'
    expect(getSendInGasToken(safeTx, ZERO_ADDRESS)).toBe(500000000000000000n)
  })

  it('returns 0 when gas token is ERC20 and the tx sends native', () => {
    const safeTx = createSafeTx()
    safeTx.data.value = '500000000000000000'
    safeTx.data.data = '0x'
    expect(getSendInGasToken(safeTx, USDC)).toBe(0n)
  })

  it('returns the transferred amount when gas token matches the ERC20 being sent', () => {
    const safeTx = createSafeTx(encodeTransfer(RECIPIENT, 100000000n))
    safeTx.data.to = USDC
    expect(getSendInGasToken(safeTx, USDC)).toBe(100000000n)
  })
})

describe('computeTotalOutgoing', () => {
  const baseInputs = {
    gasWei: 1000000n, // 1 USDC worth
    relayCostFiat: 0.5,
    relayCostFiatCode: 'USD',
    nativeSymbol: 'ETH',
    nativeDecimals: 18,
    gasSymbol: 'USDC',
    gasDecimals: 6,
    balances: buildBalances(),
  }

  it('bundles amounts when gas token matches the ERC20 transferred', () => {
    const safeTx = createSafeTx(encodeTransfer(RECIPIENT, 50000000n))
    safeTx.data.to = USDC

    const result = computeTotalOutgoing({ ...baseInputs, safeTx, gasTokenAddress: USDC })

    expect(result?.primary).toEqual([{ amount: '51', currency: 'USDC' }])
    expect(result?.fees).toBeUndefined()
  })

  it('returns separate primary and fees lines when gas token differs from sent token', () => {
    const safeTx = createSafeTx()
    safeTx.data.value = '1000000000000000000'
    safeTx.data.data = '0x'

    const result = computeTotalOutgoing({ ...baseInputs, safeTx, gasTokenAddress: USDC })

    expect(result?.primary).toEqual([{ amount: '1', currency: 'ETH' }])
    expect(result?.fees).toEqual({ amount: '1', currency: 'USDC' })
  })

  it('returns the fee alone for empty self-call', () => {
    const safeTx = createSafeTx()
    safeTx.data.value = '0'
    safeTx.data.data = '0x'

    const result = computeTotalOutgoing({ ...baseInputs, safeTx, gasTokenAddress: USDC })

    expect(result?.primary).toEqual([])
    expect(result?.fees).toEqual({ amount: '1', currency: 'USDC' })
  })

  it('returns the fee alone for a contract call that moves no funds (e.g. adding an owner)', () => {
    const safeTx = createSafeTx()
    safeTx.data.value = '0'
    // addOwnerWithThreshold(address,uint256)
    safeTx.data.data =
      '0x0d582f1300000000000000000000000006de3714a10f9af1c870aa7737a3eeb1b42649730000000000000000000000000000000000000000000000000000000000000001'

    const result = computeTotalOutgoing({ ...baseInputs, safeTx, gasTokenAddress: USDC })

    expect(result?.primary).toEqual([])
    expect(result?.fees).toEqual({ amount: '1', currency: 'USDC' })
  })

  describe('withoutFees', () => {
    it('drops the fee line and keeps what is sent', () => {
      expect(
        withoutFees({
          primary: [{ amount: '1', currency: 'ETH' }],
          fees: { amount: '1', currency: 'USDC' },
          fiatTotal: '$2',
        }),
      ).toEqual({ primary: [{ amount: '1', currency: 'ETH' }], fees: undefined, fiatTotal: '$2' })
    })

    it('hides the row when the fee was all that left the Safe', () => {
      expect(withoutFees({ primary: [], fees: { amount: '1', currency: 'ETH' }, fiatTotal: '$1' })).toBeUndefined()
      expect(withoutFees(undefined)).toBeUndefined()
    })
  })
})

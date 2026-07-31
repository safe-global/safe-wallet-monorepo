import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { isErc20Balance, isNativeTokenAddress } from '../erc20'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const NATIVE_SENTINEL = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

describe('isNativeTokenAddress', () => {
  it('recognises the sentinels used for the native coin', () => {
    expect(isNativeTokenAddress(ZERO_ADDRESS)).toBe(true)
    expect(isNativeTokenAddress(NATIVE_SENTINEL)).toBe(true)
    // Casing is irrelevant — these are addresses.
    expect(isNativeTokenAddress(NATIVE_SENTINEL.toLowerCase())).toBe(true)
  })

  it('leaves real ERC-20s alone', () => {
    expect(isNativeTokenAddress(USDC)).toBe(false)
    expect(isNativeTokenAddress(undefined)).toBe(false)
    expect(isNativeTokenAddress('')).toBe(false)
  })
})

describe('isErc20Balance', () => {
  // The native coin can't be a policy target: a value transfer carries no selector.
  it('rejects the native balance by type', () => {
    expect(isErc20Balance({ tokenInfo: { type: 'NATIVE_TOKEN', address: ZERO_ADDRESS } })).toBe(false)
  })

  it('rejects a native sentinel address even when the type says otherwise', () => {
    expect(isErc20Balance({ tokenInfo: { type: 'ERC20', address: NATIVE_SENTINEL } })).toBe(false)
  })

  it('accepts an ERC-20 balance', () => {
    expect(isErc20Balance({ tokenInfo: { type: 'ERC20', address: USDC } })).toBe(true)
  })
})

import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { NO_TOKEN_SELECTED_ERROR } from '@/features/spending-limits/services'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { DUPLICATE_SPENDER_ERROR, DUPLICATE_TOKEN_ERROR, EXISTING_LIMIT_ERROR } from '../../constants'
import {
  existingTokensForSpender,
  validateLimitAmount,
  validateNoExistingLimit,
  validateUniqueSpender,
  validateUniqueToken,
} from '../validation'

// Contains hex letters so the case-insensitivity test really changes the string.
const SPENDER = '0x1234567890abcdef1234567890abcdef12345678'
const OTHER = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe('validateUniqueSpender', () => {
  it('accepts an address no other spender uses', () => {
    expect(validateUniqueSpender(SPENDER, [OTHER, ''])).toBeUndefined()
  })

  it('rejects an address another spender already uses, ignoring case', () => {
    expect(validateUniqueSpender(SPENDER.toUpperCase().replace('0X', '0x'), [OTHER, SPENDER])).toBe(
      DUPLICATE_SPENDER_ERROR,
    )
  })

  it('ignores empty siblings', () => {
    expect(validateUniqueSpender('', ['', ''])).toBeUndefined()
  })
})

describe('validateUniqueToken', () => {
  it('accepts a token no sibling row uses', () => {
    expect(validateUniqueToken(USDC, [ZERO_ADDRESS, ''])).toBeUndefined()
  })

  it('rejects a token a sibling row already uses, ignoring case', () => {
    expect(validateUniqueToken(USDC.toLowerCase(), [USDC])).toBe(DUPLICATE_TOKEN_ERROR)
  })
})

describe('validateLimitAmount', () => {
  it('asks for a token before judging the amount', () => {
    expect(validateLimitAmount('1', undefined)).toBe(NO_TOKEN_SELECTED_ERROR)
  })

  it('accepts a plain amount that fits the token decimals', () => {
    expect(validateLimitAmount('1.5', 18)).toBeUndefined()
  })

  it('rejects a non-numeric amount', () => {
    expect(validateLimitAmount('abc', 18)).toBeDefined()
  })

  it('rejects more decimals than the token has', () => {
    expect(validateLimitAmount('1.0000001', 6)).toBeDefined()
  })

  it('rejects an amount that does not fit uint96', () => {
    expect(validateLimitAmount('100000000000000000000', 18)).toBe('Amount is too big')
  })
})

describe('existing on-chain limits', () => {
  const spender = '0x1234567890123456789012345678901234567890'
  const other = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
  const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const limitFor = (beneficiary: string, tokenAddress: string) =>
    spendingLimitStateBuilder()
      .with({ beneficiary, token: { ...spendingLimitStateBuilder().build().token, address: tokenAddress } })
      .build()

  describe('validateNoExistingLimit', () => {
    it('rejects a token the spender already has a limit for, whatever the casing', () => {
      const existing = [limitFor(spender.toLowerCase(), usdc.toLowerCase())]

      expect(validateNoExistingLimit(usdc, spender, existing)).toBe(EXISTING_LIMIT_ERROR)
    })

    it('accepts the token when only another spender has a limit for it', () => {
      expect(validateNoExistingLimit(usdc, spender, [limitFor(other, usdc)])).toBeUndefined()
    })

    it('accepts everything while the limits are unknown', () => {
      expect(validateNoExistingLimit(usdc, spender, undefined)).toBeUndefined()
    })
  })

  describe('existingTokensForSpender', () => {
    it("lists the tokens the spender already has limits for and nobody else's", () => {
      const existing = [limitFor(spender, usdc), limitFor(other, spendingLimitStateBuilder().build().token.address)]

      expect(existingTokensForSpender(spender, existing)).toEqual([usdc])
    })

    it('is empty for an untyped spender or unknown limits', () => {
      expect(existingTokensForSpender('', [limitFor(spender, usdc)])).toEqual([])
      expect(existingTokensForSpender(spender, undefined)).toEqual([])
    })
  })
})

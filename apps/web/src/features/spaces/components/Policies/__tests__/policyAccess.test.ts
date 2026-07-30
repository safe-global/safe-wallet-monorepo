import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { isFallbackAccess, isFallbackPolicyId } from '../policyAccess'

const TOKEN = '0x1111111111111111111111111111111111111111'
const TRANSFER = '0xa9059cbb'
const ZERO_SELECTOR = '0x00000000'

describe('isFallbackPolicyId', () => {
  // The catch-all access packs to selector 0 ‖ target 0, i.e. an all-zero id.
  it('recognises the all-zero id', () => {
    expect(isFallbackPolicyId(`0x${'0'.repeat(64)}`)).toBe(true)
  })

  it('rejects an id carrying a selector and target', () => {
    expect(isFallbackPolicyId(`0xa9059cbb${'0'.repeat(16)}${TOKEN.slice(2)}`)).toBe(false)
  })

  it('rejects missing ids', () => {
    expect(isFallbackPolicyId(undefined)).toBe(false)
    expect(isFallbackPolicyId(null)).toBe(false)
    expect(isFallbackPolicyId('')).toBe(false)
  })
})

describe('isFallbackAccess', () => {
  it('recognises a zero target with a zero selector', () => {
    expect(isFallbackAccess({ target: ZERO_ADDRESS, selector: ZERO_SELECTOR })).toBe(true)
  })

  it('rejects a specific access', () => {
    expect(isFallbackAccess({ target: TOKEN, selector: TRANSFER })).toBe(false)
  })

  // Half-zero is a real access (any-selector on one target, or one selector on any target).
  it('rejects a partially zero access', () => {
    expect(isFallbackAccess({ target: ZERO_ADDRESS, selector: TRANSFER })).toBe(false)
    expect(isFallbackAccess({ target: TOKEN, selector: ZERO_SELECTOR })).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(isFallbackAccess({})).toBe(false)
    expect(isFallbackAccess({ target: ZERO_ADDRESS, selector: null })).toBe(false)
  })
})

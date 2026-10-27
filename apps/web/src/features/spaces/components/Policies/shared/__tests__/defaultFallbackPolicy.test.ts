import { getDefaultFallbackPolicy } from '../defaultFallbackPolicy'

const ALLOW_POLICY = '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2'
const DENY_POLICY = '0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436'

describe('getDefaultFallbackPolicy', () => {
  it('defaults to AllowPolicy', () => {
    expect(getDefaultFallbackPolicy('11155111')).toBe(ALLOW_POLICY)
  })

  it('switches to DenyPolicy when configured to deny', () => {
    expect(getDefaultFallbackPolicy('11155111', 'deny')).toBe(DENY_POLICY)
  })

  it('returns nothing on a chain without a policy engine', () => {
    expect(getDefaultFallbackPolicy('10')).toBeUndefined()
  })
})

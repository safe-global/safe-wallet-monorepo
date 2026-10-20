import { getPolicyEngineAddress, getPolicyGuardAddress, isSafeVersionSupported } from '../policyEngineDeployments'

describe('policyEngineDeployments', () => {
  it('returns the Sepolia policy guard', () => {
    expect(getPolicyGuardAddress('11155111')).toBe('0x5202B1ebE100812437d47eae769e155945fbba6a')
  })

  it('returns a policy address per chain', () => {
    expect(getPolicyEngineAddress('11155111', 'AllowPolicy')).toBe('0x92e94Af03982C2486dffa8DcBc5d069D33996eF2')
  })

  it('returns the indexer-watched policies', () => {
    expect(getPolicyEngineAddress('11155111', 'DenyPolicy')).toBe('0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436')
    expect(getPolicyEngineAddress('11155111', 'CoSignerPolicy')).toBe('0xd9f2A31C5C68422a466754cd4F4965Be2b6024FB')
    expect(getPolicyEngineAddress('11155111', 'ERC20TransferPolicy')).toBe('0x25DDa3b8974a10E93ca188F9C149A42F938Bd187')
    expect(getPolicyEngineAddress('11155111', 'NativeTransferPolicy')).toBe(
      '0x01b792988be451C5F6327b6e2D215Ff1d4cc7246',
    )
  })

  it('returns undefined for a chain without a deployment', () => {
    expect(getPolicyGuardAddress('1')).toBeUndefined()
    expect(getPolicyEngineAddress('1', 'AllowPolicy')).toBeUndefined()
  })
})

describe('isSafeVersionSupported', () => {
  it.each([
    ['1.4.1', false],
    ['1.5.0', true],
    ['1.5.0+L2', true],
    ['1.6.0', true],
    ['1.3.0+L2', false],
    ['not-a-version', false],
    ['', false],
    [null, false],
    [undefined, false],
  ])('%s → %s', (version, expected) => {
    expect(isSafeVersionSupported(version)).toBe(expected)
  })
})

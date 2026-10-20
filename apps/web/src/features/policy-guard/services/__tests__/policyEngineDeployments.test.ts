import { getPolicyEngineAddress, getPolicyGuardAddress, isSafeVersionSupported } from '../policyEngineDeployments'

describe('policyEngineDeployments', () => {
  it.each(['1', '137', '11155111'])('returns the 60s-delay policy guard on chain %s', (chainId) => {
    expect(getPolicyGuardAddress(chainId)).toBe('0xC83bC185770ac0Da8A970f35695064eEe62e236c')
  })

  it.each(['1', '137', '11155111'])('returns the indexer-watched policies on chain %s', (chainId) => {
    expect(getPolicyEngineAddress(chainId, 'ERC20ApprovePolicy')).toBe('0xfF86DD4caf79672E55e0C3e3A5410746600d60F4')
    expect(getPolicyEngineAddress(chainId, 'ERC20TransferPolicy')).toBe('0x25DDa3b8974a10E93ca188F9C149A42F938Bd187')
  })

  it('returns undefined for a chain without a deployment', () => {
    expect(getPolicyGuardAddress('100')).toBeUndefined()
    expect(getPolicyEngineAddress('100', 'ERC20TransferPolicy')).toBeUndefined()
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

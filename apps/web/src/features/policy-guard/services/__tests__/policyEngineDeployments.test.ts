import {
  getPolicyEngineAddress,
  getPolicyGuardAddress,
  isPolicyGuard,
  isSafeVersionSupported,
} from '../policyEngineDeployments'

describe('policyEngineDeployments', () => {
  it.each(['1', '137', '11155111'])('returns the 60s-delay policy guard on chain %s', (chainId) => {
    expect(getPolicyGuardAddress(chainId)).toBe('0xC83bC185770ac0Da8A970f35695064eEe62e236c')
  })

  it.each(['1', '137', '11155111'])('returns the indexer-watched policies on chain %s', (chainId) => {
    expect(getPolicyEngineAddress(chainId, 'ERC20ApprovePolicy')).toBe('0xfF86DD4caf79672E55e0C3e3A5410746600d60F4')
    expect(getPolicyEngineAddress(chainId, 'ERC20TransferPolicy')).toBe('0x25DDa3b8974a10E93ca188F9C149A42F938Bd187')
  })

  it.each(['1', '137', '11155111'])('returns the indexer-classified native transfer policy on chain %s', (chainId) => {
    expect(getPolicyEngineAddress(chainId, 'NativeTransferPolicy')).toBe('0x2868C263EBF3672211E4C32e0B21689FF0584ca3')
  })

  it.each(['100', '84532'])('has no native transfer policy on chain %s, which has no guard', (chainId) => {
    expect(getPolicyEngineAddress(chainId, 'NativeTransferPolicy')).toBeUndefined()
  })

  it.each(['1', '137', '11155111'])('returns the fallback policies on chain %s', (chainId) => {
    expect(getPolicyEngineAddress(chainId, 'AllowPolicy')).toBe('0x92e94Af03982C2486dffa8DcBc5d069D33996eF2')
    expect(getPolicyEngineAddress(chainId, 'DenyPolicy')).toBe('0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436')
    expect(getPolicyEngineAddress(chainId, 'MultiSendPolicy')).toBe('0xF933Ec646F9cd6Dd27Ae2f808D133D3f5847210c')
  })

  it('returns undefined for a chain without a deployment', () => {
    expect(getPolicyGuardAddress('999999')).toBeUndefined()
    expect(getPolicyEngineAddress('999999', 'ERC20TransferPolicy')).toBeUndefined()
  })
})

describe('isPolicyGuard', () => {
  it.each([
    ['0x55c241591E12CE3c58491D02b737F12D3199ae95', true],
    ['0xc83bc185770ac0da8a970f35695064eee62e236c', true],
    ['0x2d4527fD0E79ca1e533E3C7BBEF7e0668b700aED', true],
    ['0x1111111111111111111111111111111111111111', false],
    ['', false],
    [null, false],
    [undefined, false],
  ])('%s → %s', (address, expected) => {
    expect(isPolicyGuard(address)).toBe(expected)
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

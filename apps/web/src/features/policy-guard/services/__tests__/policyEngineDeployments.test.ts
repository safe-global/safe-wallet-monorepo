import {
  getPolicyEngineAddress,
  getPolicyGuardAddress,
  isPolicyGuard,
  isSafeVersionSupported,
} from '../policyEngineDeployments'
import type * as PolicyEngineDeployments from '../policyEngineDeployments'

describe('policyEngineDeployments', () => {
  it('should return the 3-minute-delay policy guard, when the chain is Sepolia', () => {
    expect(getPolicyGuardAddress('11155111')).toBe('0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f')
  })

  it('should return the 3-minute-delay policy guard, when the chain is Polygon', () => {
    expect(getPolicyGuardAddress('137')).toBe('0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f')
  })

  it('should return no policy guard, when the chain is Ethereum, where the 3-minute guard is not indexed', () => {
    expect(getPolicyGuardAddress('1')).toBeUndefined()
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

describe('the policy guard of the configured delay', () => {
  const loadWithDelay = (delay: string): typeof PolicyEngineDeployments => {
    process.env.NEXT_PUBLIC_POLICY_GUARD_DELAY_SECONDS = delay
    let deployments: typeof PolicyEngineDeployments | undefined
    jest.isolateModules(() => {
      deployments = require('../policyEngineDeployments')
    })
    delete process.env.NEXT_PUBLIC_POLICY_GUARD_DELAY_SECONDS
    if (!deployments) throw new Error('policyEngineDeployments did not load')
    return deployments
  }

  it('should return the guard of that delay on every indexed chain, when the env sets 600 seconds', () => {
    const { getPolicyGuardAddress: guardOf } = loadWithDelay('600')

    expect(guardOf('1')).toBe('0x46d22E0B3DC367b48bc2d64B789ae154b3177a57')
    expect(guardOf('11155111')).toBe('0x46d22E0B3DC367b48bc2d64B789ae154b3177a57')
  })

  it('should return no policy guard, when the env sets a delay no deployed guard has', () => {
    expect(loadWithDelay('300').getPolicyGuardAddress('11155111')).toBeUndefined()
  })

  it('should fall back to the 3-minute guard, when the env sets something that is not a number', () => {
    expect(loadWithDelay('soon').getPolicyGuardAddress('11155111')).toBe('0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f')
  })
})

describe('isPolicyGuard', () => {
  it.each([
    ['0x55c241591E12CE3c58491D02b737F12D3199ae95', true],
    ['0x4d1fB05cc9bcd31cCA651B2833b4E71229c31d1f', true],
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

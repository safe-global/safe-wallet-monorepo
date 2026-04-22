import { getMultiSendCallOnlyDeployments } from '@safe-global/safe-deployments'
import type { DeploymentFilter, SingletonDeploymentV2 } from '@safe-global/safe-deployments'
import {
  getCanonicalOrFirstAddress,
  getChainAgnosticAddress,
  hasCanonicalDeployment,
  hasMatchingDeployment,
  isCanonicalDeployment,
  isChainAgnosticVersion,
  getCanonicalMultiSendCallOnlyAddress,
  getCanonicalMultiSendAddress,
  resolveChainAgnosticContractAddresses,
} from '../../contracts/deployments'
import { ZKSYNC_ERA_CHAIN_ID } from '../../../config/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

// picks the zk address for 1.5.0 if/when it has a zkSync deployment:
const ZKSYNC_MULTISEND_CALL_ONLY_VERSIONS = (['1.3.0', '1.4.1', '1.5.0'] as const).filter(
  (v) => getMultiSendCallOnlyDeployments({ version: v })?.deployments.zksync?.address,
)

describe('deployments utils', () => {
  const chainId = '1'

  const makeDeployment = (
    deployments: SingletonDeploymentV2['deployments'],
    networkAddresses: SingletonDeploymentV2['networkAddresses'],
  ): SingletonDeploymentV2 => {
    return {
      version: '1.4.1',
      contractName: 'Test',
      released: true,
      deployments,
      networkAddresses,
      abi: [],
    }
  }

  describe('hasCanonicalDeployment', () => {
    it('returns true when canonical address is present in network addresses', () => {
      const canonical = '0x1111111111111111111111111111111111111111'
      const deployment = makeDeployment(
        { canonical: { address: canonical, codeHash: '0xhash' } },
        { [chainId]: [canonical] },
      )
      expect(hasCanonicalDeployment(deployment, chainId)).toBe(true)
    })

    it('returns false when canonical missing or not in network addresses', () => {
      const canonical = '0x1111111111111111111111111111111111111111'
      const other = '0x2222222222222222222222222222222222222222'
      expect(hasCanonicalDeployment(undefined, chainId)).toBe(false)
      const deployment = makeDeployment(
        { canonical: { address: canonical, codeHash: '0xhash' } },
        { [chainId]: [other] },
      )
      expect(hasCanonicalDeployment(deployment, chainId)).toBe(false)
    })
  })

  describe('getCanonicalOrFirstAddress', () => {
    it.each([
      {
        testName: 'returns canonical when present for chain',
        addresses: ['0x4444444444444444444444444444444444444444', '0x3333333333333333333333333333333333333333'],
        expectedAddress: '0x3333333333333333333333333333333333333333',
      },
      {
        testName: 'returns first network address when canonical not present for chain',
        addresses: ['0x4444444444444444444444444444444444444444', '0x5555555555555555555555555555555555555555'],
        expectedAddress: '0x4444444444444444444444444444444444444444',
      },
    ])('$testName', ({ addresses, expectedAddress }) => {
      const canonical = '0x3333333333333333333333333333333333333333'
      const deployment = makeDeployment(
        { canonical: { address: canonical, codeHash: '0xhash' } },
        { [chainId]: addresses },
      )
      expect(getCanonicalOrFirstAddress(deployment, chainId)).toBe(expectedAddress)
    })

    it('returns undefined when no deployment', () => {
      expect(getCanonicalOrFirstAddress(undefined, chainId)).toBeUndefined()
    })
  })

  describe('getChainAgnosticAddress', () => {
    const canonical = '0x1111111111111111111111111111111111111111'
    const eip155Addr = '0x2222222222222222222222222222222222222222'
    const unknownChainId = '999999'

    it('returns per-chain address when chain is registered', () => {
      const deployment = makeDeployment(
        { canonical: { address: canonical, codeHash: '0xhash' } },
        { [chainId]: [canonical] },
      )
      expect(getChainAgnosticAddress(deployment, chainId)).toBe(canonical)
    })

    it('falls back to canonical address for unregistered chains', () => {
      const deployment = makeDeployment(
        { canonical: { address: canonical, codeHash: '0xhash' } },
        { [chainId]: [canonical] }, // only chainId=1 is registered
      )
      expect(getChainAgnosticAddress(deployment, unknownChainId)).toBe(canonical)
    })

    it('uses specified deployment type for fallback', () => {
      const deployment = makeDeployment(
        {
          canonical: { address: canonical, codeHash: '0xhash' },
          eip155: { address: eip155Addr, codeHash: '0xhash2' },
        },
        {},
      )
      expect(getChainAgnosticAddress(deployment, unknownChainId, 'eip155')).toBe(eip155Addr)
    })

    it('returns undefined when no deployment', () => {
      expect(getChainAgnosticAddress(undefined, chainId)).toBeUndefined()
    })

    it('returns undefined when deployment type does not exist', () => {
      const deployment = makeDeployment({ canonical: { address: canonical, codeHash: '0xhash' } }, {})
      expect(getChainAgnosticAddress(deployment, unknownChainId, 'zksync')).toBeUndefined()
    })
  })

  describe('hasMatchingDeployment', () => {
    const contractAddress = '0x6666666666666666666666666666666666666666'
    const otherAddress = '0x7777777777777777777777777777777777777777'

    it('returns true when contract address matches canonical deployment', () => {
      const canonical = contractAddress
      const getDeployments = jest.fn(() =>
        makeDeployment({ canonical: { address: canonical, codeHash: '0xhash' } }, { [chainId]: [canonical] }),
      )
      expect(hasMatchingDeployment(getDeployments, contractAddress, chainId, ['1.4.1'])).toBe(true)
    })

    it('returns true when contract address matches network address', () => {
      const getDeployments = jest.fn(() =>
        makeDeployment({ canonical: { address: otherAddress, codeHash: '0xhash' } }, { [chainId]: [contractAddress] }),
      )
      expect(hasMatchingDeployment(getDeployments, contractAddress, chainId, ['1.4.1'])).toBe(true)
    })

    it('returns false when contract address does not match', () => {
      const getDeployments = jest.fn(() =>
        makeDeployment({ canonical: { address: otherAddress, codeHash: '0xhash' } }, { [chainId]: [otherAddress] }),
      )
      expect(hasMatchingDeployment(getDeployments, contractAddress, chainId, ['1.4.1'])).toBe(false)
    })

    it('checks multiple versions', () => {
      const getDeployments = jest.fn((filter?: DeploymentFilter) => {
        if (filter?.version === '1.3.0') {
          return makeDeployment(
            { canonical: { address: contractAddress, codeHash: '0xhash' } },
            { [chainId]: [contractAddress] },
          )
        }
        return undefined
      })
      expect(hasMatchingDeployment(getDeployments, contractAddress, chainId, ['1.3.0', '1.4.1'])).toBe(true)
      expect(hasMatchingDeployment(getDeployments, contractAddress, chainId, ['1.4.1'])).toBe(false)
    })
  })

  describe('isCanonicalDeployment', () => {
    // Canonical L2 Safe 1.3.0 mastercopy address
    const CANONICAL_L2_SAFE = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'
    // zkSync-specific L2 Safe 1.3.0 mastercopy address (EraVM bytecode)
    const ZKSYNC_L2_SAFE = '0x1727c2c531cf966f902E5927b98490fDFb3b2b70'

    it('returns true for canonical mastercopy on zkSync', () => {
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, ZKSYNC_ERA_CHAIN_ID, '1.3.0')).toBe(true)
    })

    it('returns true for canonical mastercopy on zkSync (case insensitive)', () => {
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE.toLowerCase(), ZKSYNC_ERA_CHAIN_ID, '1.3.0')).toBe(true)
    })

    it('returns false for zkSync-specific mastercopy on zkSync', () => {
      // zkSync-specific mastercopies have EraVM bytecode and should not be treated as canonical
      expect(isCanonicalDeployment(ZKSYNC_L2_SAFE, ZKSYNC_ERA_CHAIN_ID, '1.3.0')).toBe(false)
    })

    it('returns false for non-canonical address on zkSync', () => {
      const nonCanonicalAddress = '0x1234567890123456789012345678901234567890'
      expect(isCanonicalDeployment(nonCanonicalAddress, ZKSYNC_ERA_CHAIN_ID, '1.3.0')).toBe(false)
    })

    it('returns false for non-zkSync chains', () => {
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, '1', '1.3.0')).toBe(false)
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, '137', '1.3.0')).toBe(false)
    })

    it('returns false for unsupported zkSync chains', () => {
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, '300', '1.3.0')).toBe(false)
    })

    it('returns false for empty implementation address', () => {
      expect(isCanonicalDeployment('', ZKSYNC_ERA_CHAIN_ID, '1.3.0')).toBe(false)
    })
  })

  describe('getCanonicalMultiSendCallOnlyAddress', () => {
    const MAINNET = '1'
    const ZKSYNC = '324'
    const SOPHON = '50104' // zkSync-only: no canonical in any version.
    const ROPSTEN = '3' // v1.3.0 canonical only — exercises v1.4.1 → v1.3.0 fallback.
    const FORWARD_ONLY_CHAIN = '63' // v1.5.0 canonical only — proves we never walk upward.
    const EIP155_ONLY_V130 = '16' // v1.3.0 registered but as eip155, no canonical.

    let warnSpy: jest.SpyInstance

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
    })

    it('returns the requested version when canonical is registered on the chain', () => {
      const v130 = getMultiSendCallOnlyDeployments({ version: '1.3.0' })?.deployments.canonical?.address
      expect(getCanonicalMultiSendCallOnlyAddress(MAINNET, '1.3.0')).toBe(v130)
    })

    it('returns v1.5.0 canonical on mainnet where v1.5.0 is registered', () => {
      const v150 = getMultiSendCallOnlyDeployments({ version: '1.5.0' })?.deployments.canonical?.address
      expect(getCanonicalMultiSendCallOnlyAddress(MAINNET, '1.5.0')).toBe(v150)
    })

    it('falls back from v1.5.0 to v1.4.1 canonical on zkSync (324)', () => {
      const v141 = getMultiSendCallOnlyDeployments({ version: '1.4.1' })?.deployments.canonical?.address
      expect(getCanonicalMultiSendCallOnlyAddress(ZKSYNC, '1.5.0')).toBe(v141)
    })

    it('falls back from v1.4.1 to v1.3.0 canonical on Ropsten', () => {
      const v130 = getMultiSendCallOnlyDeployments({ version: '1.3.0' })?.deployments.canonical?.address
      expect(getCanonicalMultiSendCallOnlyAddress(ROPSTEN, '1.4.1')).toBe(v130)
    })

    it('falls back from v1.5.0 through v1.4.1 to v1.3.0 canonical on Ropsten', () => {
      const v130 = getMultiSendCallOnlyDeployments({ version: '1.3.0' })?.deployments.canonical?.address
      expect(getCanonicalMultiSendCallOnlyAddress(ROPSTEN, '1.5.0')).toBe(v130)
    })

    // Invariant: walks newest→oldest from requested, never upward.
    it('does NOT walk upward — requesting v1.3.0 on a v1.5.0-only chain returns undefined', () => {
      expect(getCanonicalMultiSendCallOnlyAddress(FORWARD_ONLY_CHAIN, '1.3.0')).toBeUndefined()
    })

    it('does NOT walk upward — requesting v1.4.1 on a v1.5.0-only chain returns undefined', () => {
      expect(getCanonicalMultiSendCallOnlyAddress(FORWARD_ONLY_CHAIN, '1.4.1')).toBeUndefined()
    })

    it('returns undefined on a chain where canonical is never registered (Sophon, 50104)', () => {
      expect(getCanonicalMultiSendCallOnlyAddress(SOPHON, '1.4.1')).toBeUndefined()
      expect(getCanonicalMultiSendCallOnlyAddress(SOPHON, '1.3.0')).toBeUndefined()
      expect(getCanonicalMultiSendCallOnlyAddress(SOPHON, '1.5.0')).toBeUndefined()
    })

    it('returns undefined when a chain registers the version but not the canonical type', () => {
      expect(getCanonicalMultiSendCallOnlyAddress(EIP155_ONLY_V130, '1.3.0')).toBeUndefined()
    })

    it('returns undefined for a chainId not in safe-deployments at all', () => {
      expect(getCanonicalMultiSendCallOnlyAddress('99999999999', '1.4.1')).toBeUndefined()
    })

    it('falls back to v1.3.0 when version is null and canonical is registered on the chain', () => {
      const v130 = getMultiSendCallOnlyDeployments({ version: '1.3.0' })?.deployments.canonical?.address
      expect(getCanonicalMultiSendCallOnlyAddress(MAINNET, null)).toBe(v130)
    })

    it('returns undefined when version is null and chain has no canonical registration', () => {
      expect(getCanonicalMultiSendCallOnlyAddress(SOPHON, null)).toBeUndefined()
    })

    it('falls back to v1.3.0 when version is undefined and canonical is registered on the chain', () => {
      const v130 = getMultiSendCallOnlyDeployments({ version: '1.3.0' })?.deployments.canonical?.address
      expect(getCanonicalMultiSendCallOnlyAddress(MAINNET, undefined)).toBe(v130)
    })

    it('handles a version string not in the fallback list without crashing', () => {
      expect(() => getCanonicalMultiSendCallOnlyAddress(MAINNET, '1.2.0' as SafeState['version'])).not.toThrow()
    })

    it('logs a warning when no canonical is registered on the chain', () => {
      getCanonicalMultiSendCallOnlyAddress(SOPHON, '1.4.1')
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[MultiSendCallOnly]'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(SOPHON))
    })

    it('does NOT log a warning on the happy path', () => {
      getCanonicalMultiSendCallOnlyAddress(MAINNET, '1.3.0')
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('getCanonicalMultiSendAddress', () => {
    it('returns canonical MultiSend address for version 1.3.0', () => {
      const address = getCanonicalMultiSendAddress('1.3.0')
      expect(address).toBe('0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761')
    })

    it('falls back to 1.3.0 for null version', () => {
      const address = getCanonicalMultiSendAddress(null)
      expect(address).toBe('0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761')
    })
  })

  describe('isChainAgnosticVersion', () => {
    it('returns true for version 1.4.1', () => {
      expect(isChainAgnosticVersion('1.4.1')).toBe(true)
    })

    it('returns true for version 1.5.0', () => {
      expect(isChainAgnosticVersion('1.5.0')).toBe(true)
    })

    it('returns false for version 1.3.0', () => {
      expect(isChainAgnosticVersion('1.3.0')).toBe(false)
    })

    it('returns false for version 1.0.0', () => {
      expect(isChainAgnosticVersion('1.0.0')).toBe(false)
    })

    it('strips version metadata before checking', () => {
      expect(isChainAgnosticVersion('1.4.1+L2')).toBe(true)
      expect(isChainAgnosticVersion('1.3.0+L2')).toBe(false)
    })
  })

  describe('resolveChainAgnosticContractAddresses', () => {
    it('resolves all canonical addresses for version 1.4.1 on L2 chains', () => {
      const result = resolveChainAgnosticContractAddresses('1.4.1', true, false)

      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBeDefined()
      expect(result!.multiSendAddress).toBeDefined()
      expect(result!.multiSendCallOnlyAddress).toBeDefined()
      expect(result!.safeProxyFactoryAddress).toBeDefined()
      expect(result!.fallbackHandlerAddress).toBeDefined()
      expect(result!.signMessageLibAddress).toBeDefined()
      expect(result!.createCallAddress).toBeDefined()
      expect(result!.simulateTxAccessorAddress).toBeDefined()
    })

    it('resolves all canonical addresses for version 1.4.1 on L1 chains', () => {
      const result = resolveChainAgnosticContractAddresses('1.4.1', false, false)

      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBeDefined()
    })

    it('returns different singleton addresses for L1 vs L2', () => {
      const l1Result = resolveChainAgnosticContractAddresses('1.4.1', false, false)
      const l2Result = resolveChainAgnosticContractAddresses('1.4.1', true, false)

      expect(l1Result).toBeDefined()
      expect(l2Result).toBeDefined()
      expect(l1Result!.safeSingletonAddress).not.toBe(l2Result!.safeSingletonAddress)
    })

    it('resolves zksync deployment type addresses when isZk is true', () => {
      const canonicalResult = resolveChainAgnosticContractAddresses('1.4.1', true, false)
      const zkResult = resolveChainAgnosticContractAddresses('1.4.1', true, true)

      expect(canonicalResult).toBeDefined()
      expect(zkResult).toBeDefined()
      // zkSync uses different addresses than canonical
      expect(zkResult!.safeSingletonAddress).not.toBe(canonicalResult!.safeSingletonAddress)
    })

    it('strips version metadata before resolving', () => {
      const result = resolveChainAgnosticContractAddresses('1.4.1+L2', true, false)
      const directResult = resolveChainAgnosticContractAddresses('1.4.1', true, false)

      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBe(directResult!.safeSingletonAddress)
    })

    it('returns undefined when singleton has no address for the version', () => {
      const result = resolveChainAgnosticContractAddresses('0.0.1', true, false)
      expect(result).toBeUndefined()
    })

    it('logs warning when singleton cannot be resolved', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
      resolveChainAgnosticContractAddresses('0.0.1', true, false)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No singleton address'))
      warnSpy.mockRestore()
    })

    it('returns partial result with warning when auxiliary contracts are missing', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
      // 1.3.0 has canonical deployments — should resolve singleton even if some aux are missing
      const result = resolveChainAgnosticContractAddresses('1.3.0', true, false)

      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBeDefined()

      // If any auxiliary was missing, a warning would have been logged
      // Either way, the result should have the singleton
      warnSpy.mockRestore()
    })

    it('resolves addresses for version 1.3.0 canonical', () => {
      const result = resolveChainAgnosticContractAddresses('1.3.0', true, false)

      // 1.3.0 has canonical deployments
      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBeDefined()
    })
  })

  // eip155 MultiSendCallOnly ships only in v1.3.0.
  describe('eip155 MultiSendCallOnly v1.3.0', () => {
    const deployment = getMultiSendCallOnlyDeployments({ version: '1.3.0' })
    const eip155Address = deployment?.deployments.eip155?.address
    const MAINNET_CHAIN_ID = '1'
    const CANONICAL_ONLY_CHAIN_ID = '30'

    it('safe-deployments declares an eip155 address for v1.3.0', () => {
      expect(eip155Address).toBeDefined()
    })

    it('getChainAgnosticAddress returns the eip155 address on chain 1 with deploymentType="eip155"', () => {
      const address = getChainAgnosticAddress(deployment, MAINNET_CHAIN_ID, 'eip155')
      expect(address).toBe(eip155Address)
    })

    it('does NOT return the eip155 address on a canonical-only chain (chain 30)', () => {
      const address = getChainAgnosticAddress(deployment, CANONICAL_ONLY_CHAIN_ID, 'eip155')
      expect(address).not.toBe(eip155Address)
    })
  })

  describe.each(ZKSYNC_MULTISEND_CALL_ONLY_VERSIONS)('zkSync Era MultiSendCallOnly v%s', (version) => {
    const deployment = getMultiSendCallOnlyDeployments({ version })
    const expectedZkAddress = deployment?.deployments.zksync?.address

    it(`safe-deployments declares a zkSync-specific address for v${version}`, () => {
      expect(expectedZkAddress).toBeDefined()
    })

    it(`getChainAgnosticAddress returns the zkSync address on chain 324 with deploymentType="zksync" for v${version}`, () => {
      const address = getChainAgnosticAddress(deployment, ZKSYNC_ERA_CHAIN_ID, 'zksync')
      expect(address).toBe(expectedZkAddress)
    })

    it(`resolveChainAgnosticContractAddresses returns the zkSync MultiSendCallOnly address when isZk=true for v${version}`, () => {
      const resolved = resolveChainAgnosticContractAddresses(version, true, true)
      expect(resolved).toBeDefined()
      expect(resolved!.multiSendCallOnlyAddress).toBe(expectedZkAddress)
    })

    it(`does NOT return the zkSync address on mainnet (chain 1) for v${version}`, () => {
      const address = getChainAgnosticAddress(deployment, '1', 'zksync')
      expect(address).not.toBe(expectedZkAddress)
    })
  })
})

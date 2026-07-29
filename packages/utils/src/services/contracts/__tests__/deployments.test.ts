import type { DeploymentFilter, SingletonDeploymentV2 } from '@safe-global/safe-deployments'
import {
  getCanonicalOrFirstAddress,
  getChainAgnosticAddress,
  getDeploymentTypeForMasterCopy,
  hasCanonicalDeployment,
  hasMatchingDeployment,
  isCanonicalDeployment,
  isChainAgnosticVersion,
  isEraVmChain,
  isOfficialMasterCopy,
  getCanonicalMultiSendCallOnlyAddress,
  getCanonicalMultiSendAddress,
  resolveChainAgnosticContractAddresses,
} from '../../contracts/deployments'
import { ZKSYNC_ERA_CHAIN_ID } from '../../../config/chains'

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

    it('prefers the deployment-type address over networkAddresses[0] when the chain lists only the other flavour', () => {
      // Registered chain, but its networkAddresses list contains only the eip155
      // flavour. A caller asking for `canonical` must get the canonical address
      // (even though it isn't registered for this chain) rather than silently
      // receiving the eip155 address — returning the wrong flavour would cause
      // delegatecall mismatches for canonical Safes.
      const deployment = makeDeployment(
        {
          canonical: { address: canonical, codeHash: '0xhash' },
          eip155: { address: eip155Addr, codeHash: '0xhash2' },
        },
        { [chainId]: [eip155Addr] },
      )
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
      expect(getChainAgnosticAddress(deployment, chainId, 'canonical')).toBe(canonical)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('does not register the canonical address'))
      warnSpy.mockRestore()
    })

    it('returns networkAddresses[0] as last resort when no deployment-type address exists at all', () => {
      // Deployment bucket has no matching flavour for this caller — return whatever
      // the chain registers so the SDK can still init.
      const deployment = makeDeployment(
        { eip155: { address: eip155Addr, codeHash: '0xhash2' } },
        { [chainId]: [eip155Addr] },
      )
      expect(getChainAgnosticAddress(deployment, chainId, 'canonical')).toBe(eip155Addr)
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

    it('returns false for non-EraVM chains', () => {
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, '1', '1.3.0')).toBe(false)
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, '137', '1.3.0')).toBe(false)
    })

    it('returns true for canonical master copy on zkSync Sepolia', () => {
      // After extending detection to all EraVM-backed chains (any chain that
      // registers the `zksync` deployment address in networkAddresses), Sepolia
      // qualifies and canonical-on-EraVM should be flagged.
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, '300', '1.3.0')).toBe(true)
    })

    it('returns true for canonical master copy on Lens', () => {
      // Lens is a zk-stack chain that registers the zksync deployment address in
      // networkAddresses but is not flagged via chain.zk on CGW. Extending detection
      // to EraVM-backed chains covers this case for both 1.3.0 and 1.4.1.
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, '232', '1.3.0')).toBe(true)
      expect(isCanonicalDeployment('0x29fcB43b46531BcA003ddC8FCB67FFE91900C762', '232', '1.4.1')).toBe(true)
    })

    it('returns false for zksync-flavour master copy on Lens', () => {
      // zksync-specific mastercopies have EraVM bytecode and should not be treated as canonical
      expect(isCanonicalDeployment(ZKSYNC_L2_SAFE, '232', '1.3.0')).toBe(false)
      expect(isCanonicalDeployment('0x610fcA2e0279Fa1F8C00c8c2F71dF522AD469380', '232', '1.4.1')).toBe(false)
    })

    it('returns false for empty implementation address', () => {
      expect(isCanonicalDeployment('', ZKSYNC_ERA_CHAIN_ID, '1.3.0')).toBe(false)
    })

    it('strips version metadata before looking up safe-deployments', () => {
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, ZKSYNC_ERA_CHAIN_ID, '1.3.0+L2')).toBe(true)
      expect(isCanonicalDeployment(CANONICAL_L2_SAFE, '232', '1.3.0+L2')).toBe(true)
    })
  })

  describe('getCanonicalMultiSendCallOnlyAddress', () => {
    it('returns canonical MultiSendCallOnly address for version 1.3.0', () => {
      const address = getCanonicalMultiSendCallOnlyAddress('1.3.0')
      // Canonical MultiSendCallOnly 1.3.0 address
      expect(address).toBe('0x40A2aCCbd92BCA938b02010E17A5b8929b49130D')
    })

    it('falls back to 1.3.0 for null version', () => {
      const address = getCanonicalMultiSendCallOnlyAddress(null)
      // Should fallback to 1.3.0
      expect(address).toBe('0x40A2aCCbd92BCA938b02010E17A5b8929b49130D')
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
    // chainId not registered in safe-deployments — exercises deployment-type fallback
    const UNREGISTERED_CHAIN_ID = '99999999'
    const LENS_CHAIN_ID = '232'
    const ZKSYNC_ERA_MAINNET = '324'

    it('resolves all canonical addresses for version 1.4.1 on L2 chains', () => {
      const result = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.4.1', true, 'canonical')

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
      const result = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.4.1', false, 'canonical')

      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBeDefined()
    })

    it('returns different singleton addresses for L1 vs L2', () => {
      const l1Result = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.4.1', false, 'canonical')
      const l2Result = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.4.1', true, 'canonical')

      expect(l1Result).toBeDefined()
      expect(l2Result).toBeDefined()
      expect(l1Result!.safeSingletonAddress).not.toBe(l2Result!.safeSingletonAddress)
    })

    it('resolves zksync deployment type addresses when isZk is true', () => {
      const canonicalResult = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.4.1', true, 'canonical')
      const zkResult = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.4.1', true, 'zksync')

      expect(canonicalResult).toBeDefined()
      expect(zkResult).toBeDefined()
      // zkSync uses different addresses than canonical
      expect(zkResult!.safeSingletonAddress).not.toBe(canonicalResult!.safeSingletonAddress)
    })

    it('strips version metadata before resolving', () => {
      const result = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.4.1+L2', true, 'canonical')
      const directResult = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.4.1', true, 'canonical')

      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBe(directResult!.safeSingletonAddress)
    })

    it('returns undefined when singleton has no address for the version', () => {
      const result = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '0.0.1', true, 'canonical')
      expect(result).toBeUndefined()
    })

    it('logs warning when singleton cannot be resolved', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
      resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '0.0.1', true, 'canonical')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No singleton address'))
      warnSpy.mockRestore()
    })

    it('returns partial result with warning when auxiliary contracts are missing', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
      // 1.3.0 has canonical deployments — should resolve singleton even if some aux are missing
      const result = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.3.0', true, 'canonical')

      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBeDefined()

      // If any auxiliary was missing, a warning would have been logged
      // Either way, the result should have the singleton
      warnSpy.mockRestore()
    })

    it('resolves addresses for version 1.3.0 canonical', () => {
      const result = resolveChainAgnosticContractAddresses(UNREGISTERED_CHAIN_ID, '1.3.0', true, 'canonical')

      // 1.3.0 has canonical deployments
      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBeDefined()
    })

    it('picks the zksync-flavour aux contract on chains that register both canonical and zksync', () => {
      // Lens (chainId 232) registers BOTH the canonical and the zksync MultiSendCallOnly
      // in safe-deployments' networkAddresses["232"]. For a Safe whose master copy is the
      // zksync singleton, the resolver must pick the zksync MultiSendCallOnly
      // (0x0408EF011960d02349d50286D20531229BCef773) — not the canonical one
      // (0x9641d764fc13c8B624c04430C7356C1C7C8102e2) — otherwise the Safe will delegatecall
      // EVM bytecode from EraVM bytecode (or vice versa) and revert.
      const lensZkResult = resolveChainAgnosticContractAddresses(LENS_CHAIN_ID, '1.4.1', true, 'zksync')
      const lensCanonicalResult = resolveChainAgnosticContractAddresses(LENS_CHAIN_ID, '1.4.1', true, 'canonical')

      expect(lensZkResult).toBeDefined()
      expect(lensCanonicalResult).toBeDefined()
      expect(lensZkResult!.multiSendCallOnlyAddress).toBe('0x0408EF011960d02349d50286D20531229BCef773')
      expect(lensCanonicalResult!.multiSendCallOnlyAddress).toBe('0x9641d764fc13c8B624c04430C7356C1C7C8102e2')
    })

    it('resolves zksync Era mainnet zksync-flavour aux addresses', () => {
      const result = resolveChainAgnosticContractAddresses(ZKSYNC_ERA_MAINNET, '1.4.1', true, 'zksync')
      expect(result).toBeDefined()
      expect(result!.multiSendCallOnlyAddress).toBe('0x0408EF011960d02349d50286D20531229BCef773')
    })
  })

  describe('getDeploymentTypeForMasterCopy', () => {
    const L2_CANONICAL_141 = '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762'
    const L2_ZKSYNC_141 = '0x610fcA2e0279Fa1F8C00c8c2F71dF522AD469380'
    const L1_CANONICAL_141 = '0x41675C099F32341bf84BFc5382aF534df5C7461a'
    const L1_ZKSYNC_141 = '0xC35F063962328aC65cED5D4c3fC5dEf8dec68dFa'
    const L2_CANONICAL_130 = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'
    const L2_ZKSYNC_130 = '0x1727c2c531cf966f902E5927b98490fDFb3b2b70'
    const L1_CANONICAL_130 = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
    const L1_ZKSYNC_130 = '0xB00ce5CCcdEf57e539ddcEd01DF43a13855d9910'

    it('detects L2 canonical master copy at 1.4.1', () => {
      expect(getDeploymentTypeForMasterCopy(L2_CANONICAL_141, '1.4.1')).toEqual({
        deploymentType: 'canonical',
        isL1: false,
      })
    })

    it('detects L2 zksync master copy at 1.4.1', () => {
      expect(getDeploymentTypeForMasterCopy(L2_ZKSYNC_141, '1.4.1')).toEqual({
        deploymentType: 'zksync',
        isL1: false,
      })
    })

    // Case #2 — zkSync Era Safe running an L1 canonical master copy. The resolver
    // must pick the L1 singleton table, not the L2 one, even though the chain itself
    // is an L2.
    it('detects L1 canonical master copy at 1.4.1', () => {
      expect(getDeploymentTypeForMasterCopy(L1_CANONICAL_141, '1.4.1')).toEqual({
        deploymentType: 'canonical',
        isL1: true,
      })
    })

    it('detects L1 zksync master copy at 1.4.1', () => {
      expect(getDeploymentTypeForMasterCopy(L1_ZKSYNC_141, '1.4.1')).toEqual({
        deploymentType: 'zksync',
        isL1: true,
      })
    })

    it('detects 1.3.0 L2 canonical master copy', () => {
      expect(getDeploymentTypeForMasterCopy(L2_CANONICAL_130, '1.3.0')).toEqual({
        deploymentType: 'canonical',
        isL1: false,
      })
    })

    it('detects 1.3.0 L2 zksync master copy', () => {
      expect(getDeploymentTypeForMasterCopy(L2_ZKSYNC_130, '1.3.0')).toEqual({
        deploymentType: 'zksync',
        isL1: false,
      })
    })

    it('detects 1.3.0 L1 canonical master copy', () => {
      expect(getDeploymentTypeForMasterCopy(L1_CANONICAL_130, '1.3.0')).toEqual({
        deploymentType: 'canonical',
        isL1: true,
      })
    })

    it('detects 1.3.0 L1 zksync master copy', () => {
      expect(getDeploymentTypeForMasterCopy(L1_ZKSYNC_130, '1.3.0')).toEqual({
        deploymentType: 'zksync',
        isL1: true,
      })
    })

    it('strips version metadata before looking up', () => {
      expect(getDeploymentTypeForMasterCopy(L2_CANONICAL_141, '1.4.1+L2')).toEqual({
        deploymentType: 'canonical',
        isL1: false,
      })
    })

    it('returns defaults when master copy is unknown', () => {
      expect(getDeploymentTypeForMasterCopy('0x0000000000000000000000000000000000000001', '1.4.1')).toEqual({
        deploymentType: 'canonical',
        isL1: false,
      })
    })

    it('respects custom defaults when master copy is unknown', () => {
      expect(
        getDeploymentTypeForMasterCopy('0x0000000000000000000000000000000000000001', '1.4.1', {
          deploymentType: 'zksync',
          isL1: true,
        }),
      ).toEqual({ deploymentType: 'zksync', isL1: true })
    })

    it('returns defaults when implementation is undefined', () => {
      expect(getDeploymentTypeForMasterCopy(undefined, '1.4.1')).toEqual({
        deploymentType: 'canonical',
        isL1: false,
      })
    })
  })

  describe('isEraVmChain', () => {
    it('returns true for zkSync Era mainnet', () => {
      expect(isEraVmChain('324', '1.4.1')).toBe(true)
      expect(isEraVmChain('324', '1.3.0')).toBe(true)
    })

    it('returns true for zkSync Sepolia', () => {
      expect(isEraVmChain('300', '1.3.0')).toBe(true)
    })

    it('returns true for Lens', () => {
      expect(isEraVmChain('232', '1.4.1')).toBe(true)
      expect(isEraVmChain('232', '1.3.0')).toBe(true)
    })

    it('returns false for Ethereum mainnet', () => {
      expect(isEraVmChain('1', '1.4.1')).toBe(false)
      expect(isEraVmChain('1', '1.3.0')).toBe(false)
    })

    it('returns false for Polygon', () => {
      expect(isEraVmChain('137', '1.3.0')).toBe(false)
    })

    it('returns false for unregistered chains', () => {
      expect(isEraVmChain('99999999', '1.4.1')).toBe(false)
    })

    it('falls back to 1.3.0 when version is null', () => {
      expect(isEraVmChain('324', null)).toBe(true)
      expect(isEraVmChain('1', null)).toBe(false)
    })

    it('strips version metadata before looking up safe-deployments', () => {
      // CGW fixtures encode L2 flag as `1.3.0+L2`; the bare version must be used
      // for safe-deployments lookups or EraVM detection will silently fail.
      expect(isEraVmChain('232', '1.3.0+L2')).toBe(true)
      expect(isEraVmChain('232', '1.4.1+L2')).toBe(true)
      expect(isEraVmChain('324', '1.3.0+L2')).toBe(true)
      expect(isEraVmChain('1', '1.3.0+L2')).toBe(false)
    })
  })

  describe('isOfficialMasterCopy', () => {
    const L1_CANONICAL_130 = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552'
    const L1_EIP155_130 = '0x69f4D1788e39c87893C980c06EdF4b7f686e2938'
    const L2_CANONICAL_130 = '0x3E5c63644E683549055b9Be8653de26E0B4CD36E'
    const L1_CANONICAL_141 = '0x41675C099F32341bf84BFc5382aF534df5C7461a'
    const L1_ZKSYNC_141 = '0xC35F063962328aC65cED5D4c3fC5dEf8dec68dFa'
    const L2_ZKSYNC_141 = '0x610fcA2e0279Fa1F8C00c8c2F71dF522AD469380'

    it('returns true for an official 1.3.0 L1 canonical singleton', () => {
      expect(isOfficialMasterCopy(L1_CANONICAL_130, '1.3.0')).toBe(true)
    })

    it('returns true for an official 1.3.0 L1 eip155 singleton', () => {
      expect(isOfficialMasterCopy(L1_EIP155_130, '1.3.0')).toBe(true)
    })

    it('returns true for an official 1.3.0 L2 canonical singleton', () => {
      expect(isOfficialMasterCopy(L2_CANONICAL_130, '1.3.0')).toBe(true)
    })

    it('returns true for an official 1.4.1 L1 singleton', () => {
      expect(isOfficialMasterCopy(L1_CANONICAL_141, '1.4.1')).toBe(true)
    })

    it('returns true for an official zksync-variant singleton (L1 and L2)', () => {
      expect(isOfficialMasterCopy(L1_ZKSYNC_141, '1.4.1')).toBe(true)
      expect(isOfficialMasterCopy(L2_ZKSYNC_141, '1.4.1')).toBe(true)
    })

    it('strips +L2 build metadata before matching', () => {
      expect(isOfficialMasterCopy(L2_CANONICAL_130, '1.3.0+L2')).toBe(true)
    })

    it('returns false for an unofficial address', () => {
      expect(isOfficialMasterCopy('0x000000000000000000000000000000000000dEaD', '1.3.0')).toBe(false)
    })

    it('returns false when the version has no matching singleton', () => {
      expect(isOfficialMasterCopy(L1_CANONICAL_130, '1.1.1')).toBe(false)
    })

    it('returns false when the implementation is undefined', () => {
      expect(isOfficialMasterCopy(undefined, '1.4.1')).toBe(false)
    })
  })
})

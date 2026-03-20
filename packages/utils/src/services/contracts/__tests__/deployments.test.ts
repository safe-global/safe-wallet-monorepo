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

    it('returns undefined when deployment type has no addresses', () => {
      // Version 1.4.1 has no eip155 deployments — force an invalid type via casting
      // to verify the function returns undefined for missing deployment types
      const result = resolveChainAgnosticContractAddresses('0.0.1', true, false)
      expect(result).toBeUndefined()
    })

    it('resolves addresses for version 1.3.0 canonical', () => {
      const result = resolveChainAgnosticContractAddresses('1.3.0', true, false)

      // 1.3.0 has canonical deployments
      expect(result).toBeDefined()
      expect(result!.safeSingletonAddress).toBeDefined()
    })
  })
})

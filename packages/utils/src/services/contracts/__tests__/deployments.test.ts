import type { DeploymentFilter, SingletonDeploymentV2 } from '@safe-global/safe-deployments'
import {
  getCanonicalOrFirstAddress,
  hasCanonicalDeployment,
  hasMatchingDeployment,
  isCanonicalDeployment,
  getCanonicalMultiSendCallOnlyAddress,
  getCanonicalMultiSendAddress,
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
})

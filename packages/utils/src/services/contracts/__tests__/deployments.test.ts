import type { SingletonDeploymentV2 } from '@safe-global/safe-deployments'
import { getCanonicalOrFirstAddress, hasCanonicalDeployment } from '../../contracts/deployments'

describe('deployments utils', () => {
  const chainId = '1'

  const makeDeployment = (params: Partial<SingletonDeploymentV2>): SingletonDeploymentV2 => {
    const base: SingletonDeploymentV2 = {
      version: '1.4.1',
      contractName: 'Test',
      deployments: {},
      networkAddresses: {},
      abi: [],
    } as unknown as SingletonDeploymentV2

    return { ...base, ...(params as SingletonDeploymentV2) }
  }

  describe('hasCanonicalDeployment', () => {
    it('returns true when canonical address is present in network addresses', () => {
      const canonical = '0x1111111111111111111111111111111111111111'
      const deployment = makeDeployment({
        deployments: { canonical: { address: canonical, codeHash: '0xhash' } } as any,
        networkAddresses: { [chainId]: [canonical] } as any,
      })
      expect(hasCanonicalDeployment(deployment, chainId)).toBe(true)
    })

    it('returns false when canonical missing or not in network addresses', () => {
      const canonical = '0x1111111111111111111111111111111111111111'
      const other = '0x2222222222222222222222222222222222222222'
      expect(hasCanonicalDeployment(undefined, chainId)).toBe(false)
      const deployment = makeDeployment({
        deployments: { canonical: { address: canonical, codeHash: '0xhash' } } as any,
        networkAddresses: { [chainId]: [other] } as any,
      })
      expect(hasCanonicalDeployment(deployment, chainId)).toBe(false)
    })
  })

  describe('getCanonicalOrFirstAddress', () => {
    it('returns canonical when present for chain', () => {
      const canonical = '0x3333333333333333333333333333333333333333'
      const first = '0x4444444444444444444444444444444444444444'
      const deployment = makeDeployment({
        deployments: { canonical: { address: canonical, codeHash: '0xhash' } } as any,
        networkAddresses: { [chainId]: [first, canonical] } as any,
      })
      expect(getCanonicalOrFirstAddress(deployment, chainId)).toBe(canonical)
    })

    it('returns first network address when canonical not present for chain', () => {
      const canonical = '0x3333333333333333333333333333333333333333'
      const first = '0x4444444444444444444444444444444444444444'
      const second = '0x5555555555555555555555555555555555555555'
      const deployment = makeDeployment({
        deployments: { canonical: { address: canonical, codeHash: '0xhash' } } as any,
        networkAddresses: { [chainId]: [first, second] } as any,
      })
      expect(getCanonicalOrFirstAddress(deployment, chainId)).toBe(first)
    })

    it('returns undefined when no deployment', () => {
      expect(getCanonicalOrFirstAddress(undefined, chainId)).toBeUndefined()
    })
  })
})

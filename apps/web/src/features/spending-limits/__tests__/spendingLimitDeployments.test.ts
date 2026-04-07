import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import {
  getLatestSpendingLimitAddress,
  getDeployment,
  getDeployedSpendingLimitModuleAddress,
} from '../services/spendingLimitDeployments'

describe('getLatestSpendingLimitAddress', () => {
  it('should return the v0.1.0 address on Ethereum mainnet (chainId 1)', () => {
    const v010 = getAllowanceModuleDeployment({ version: '0.1.0' })
    const expectedAddress = v010?.networkAddresses['1']

    const result = getLatestSpendingLimitAddress('1')

    expect(result).toBe(expectedAddress)
    expect(result).not.toBeUndefined()
  })

  it('should return the v0.1.1 address on chains where v0.1.1 is deployed', () => {
    const v011 = getAllowanceModuleDeployment({ version: '0.1.1' })
    // XDC (chainId 50) has v0.1.1
    const expectedAddress = v011?.networkAddresses['50']
    expect(expectedAddress).toBeDefined()

    const result = getLatestSpendingLimitAddress('50')

    expect(result).toBe(expectedAddress)
  })

  it('should prefer v0.1.1 over v0.1.0 when both are deployed on a chain', () => {
    const v010 = getAllowanceModuleDeployment({ version: '0.1.0' })
    const v011 = getAllowanceModuleDeployment({ version: '0.1.1' })

    // Find a chain that has both versions
    const sharedChainId = Object.keys(v011?.networkAddresses ?? {}).find(
      (chainId) => v010?.networkAddresses[chainId] != null,
    )

    expect(sharedChainId).toBeDefined()

    const result = getLatestSpendingLimitAddress(sharedChainId as string)
    expect(result).toBe(v011?.networkAddresses[sharedChainId as string])
  })

  it('should NOT return the v0.1.1 address for mainnet (regression test for #7494)', () => {
    const v011 = getAllowanceModuleDeployment({ version: '0.1.1' })
    const v011Address = Object.values(v011?.networkAddresses ?? {})[0]

    // Mainnet should NOT get the v0.1.1 address since v0.1.1 was never deployed there
    const result = getLatestSpendingLimitAddress('1')

    expect(result).not.toBe(v011Address)
  })

  it('should return undefined for a chain with no deployment in any version', () => {
    const result = getLatestSpendingLimitAddress('999999')

    expect(result).toBeUndefined()
  })

  it('should return v0.1.0 address for Sepolia (chainId 11155111)', () => {
    const v010 = getAllowanceModuleDeployment({ version: '0.1.0' })
    const expectedAddress = v010?.networkAddresses['11155111']
    expect(expectedAddress).toBeDefined()

    const result = getLatestSpendingLimitAddress('11155111')

    expect(result).toBe(expectedAddress)
  })

  it('should return v0.1.0 address for Base (chainId 8453)', () => {
    const v010 = getAllowanceModuleDeployment({ version: '0.1.0' })
    const expectedAddress = v010?.networkAddresses['8453']
    expect(expectedAddress).toBeDefined()

    const result = getLatestSpendingLimitAddress('8453')

    expect(result).toBe(expectedAddress)
  })
})

describe('getDeployment', () => {
  it('should return the matching deployment when a module is enabled', () => {
    const v010 = getAllowanceModuleDeployment({ version: '0.1.0' })
    const mainnetAddress = v010?.networkAddresses['1']
    const modules = [{ value: mainnetAddress! }]

    const result = getDeployment('1', modules)

    expect(result?.version).toBe('0.1.0')
  })

  it('should return undefined when no modules are enabled', () => {
    const result = getDeployment('1', [])
    expect(result).toBeUndefined()
  })

  it('should return undefined when no module matches any deployment', () => {
    const modules = [{ value: '0x0000000000000000000000000000000000000001' }]

    const result = getDeployment('1', modules)

    expect(result).toBeUndefined()
  })
})

describe('getDeployedSpendingLimitModuleAddress', () => {
  it('should return the deployed module address for a matching version', () => {
    const v010 = getAllowanceModuleDeployment({ version: '0.1.0' })
    const mainnetAddress = v010?.networkAddresses['1']
    const modules = [{ value: mainnetAddress! }]

    const result = getDeployedSpendingLimitModuleAddress('1', modules)

    expect(result).toBe(mainnetAddress)
  })

  it('should return undefined when no module matches', () => {
    const modules = [{ value: '0x0000000000000000000000000000000000000001' }]

    const result = getDeployedSpendingLimitModuleAddress('1', modules)

    expect(result).toBeUndefined()
  })
})

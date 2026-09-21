import { faker } from '@faker-js/faker'
import { getMultiSendCallOnlyDeployments, getMultiSendDeployments } from '@safe-global/safe-deployments'
import type { SingletonDeploymentV2 } from '@safe-global/safe-deployments'
import { multiSendDefaultsToSelf, resolveMultiSendToAddress } from '../multiSend'
import { ZERO_ADDRESS } from '../constants'

const networkAddress = (deployment: SingletonDeploymentV2 | undefined, chainId: string): string => {
  const addresses = deployment?.networkAddresses?.[chainId]
  const address = Array.isArray(addresses) ? addresses[0] : addresses
  if (!address) {
    throw new Error('No deployment address found')
  }
  return address
}

describe('resolveMultiSendToAddress', () => {
  it('resolves the zero address to the executing Safe (MultiSend defaults `to` to address(this))', () => {
    const safeAddress = faker.finance.ethereumAddress()
    expect(resolveMultiSendToAddress(ZERO_ADDRESS, safeAddress)).toBe(safeAddress)
  })

  it('leaves a non-zero target unchanged', () => {
    const to = faker.finance.ethereumAddress()
    const safeAddress = faker.finance.ethereumAddress()
    expect(resolveMultiSendToAddress(to, safeAddress)).toBe(to)
  })

  it('leaves the zero address unchanged when the Safe is unknown', () => {
    expect(resolveMultiSendToAddress(ZERO_ADDRESS, undefined)).toBe(ZERO_ADDRESS)
    expect(resolveMultiSendToAddress(ZERO_ADDRESS, '')).toBe(ZERO_ADDRESS)
  })
})

describe('multiSendDefaultsToSelf', () => {
  const chainId = '1'

  it('returns true for a v1.5.0 MultiSendCallOnly deployment', () => {
    const address = networkAddress(getMultiSendCallOnlyDeployments({ version: '1.5.0', network: chainId }), chainId)
    expect(multiSendDefaultsToSelf(address, chainId)).toBe(true)
  })

  it('returns true for a v1.5.0 MultiSend deployment', () => {
    const address = networkAddress(getMultiSendDeployments({ version: '1.5.0', network: chainId }), chainId)
    expect(multiSendDefaultsToSelf(address, chainId)).toBe(true)
  })

  it('returns false for a pre-1.5.0 (v1.4.1) MultiSendCallOnly deployment', () => {
    const address = networkAddress(getMultiSendCallOnlyDeployments({ version: '1.4.1', network: chainId }), chainId)
    expect(multiSendDefaultsToSelf(address, chainId)).toBe(false)
  })

  it('returns false for an unknown address', () => {
    expect(multiSendDefaultsToSelf(faker.finance.ethereumAddress(), chainId)).toBe(false)
  })
})

import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { generateChecksummedAddress } from './addresses'

export interface SafeInfo {
  address: `0x${string}`
  chainId: string
}

export interface MockSafeInfoOptions {
  address?: `0x${string}`
  chainId?: string
}

export const createMockSafeInfo = (options: MockSafeInfoOptions = {}): SafeInfo => ({
  address: options.address ?? generateChecksummedAddress(),
  chainId: options.chainId ?? '1',
})

export interface MockSafeStateOptions {
  address?: string
  chainId?: string
  nonce?: number
  threshold?: number
  owners?: string[]
  version?: string | null
  implementationVersionState?: 'UP_TO_DATE' | 'OUTDATED' | 'UNKNOWN'
}

export const createMockSafeState = (options: MockSafeStateOptions = {}): SafeState => {
  const address = options.address ?? generateChecksummedAddress()
  const owners = options.owners ?? [generateChecksummedAddress()]

  const version = 'version' in options ? options.version : '1.3.0'

  return {
    address: { value: address, name: null, logoUri: null },
    chainId: options.chainId ?? '1',
    nonce: options.nonce ?? 0,
    threshold: options.threshold ?? 1,
    owners: owners.map((owner) => ({ value: owner, name: null, logoUri: null })),
    implementation: { value: generateChecksummedAddress(), name: null, logoUri: null },
    version,
    implementationVersionState: options.implementationVersionState ?? 'UP_TO_DATE',
  } as SafeState
}

import { faker } from '@faker-js/faker'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Signer } from '@/src/store/signersSlice'

export function generateSafeOverview({
  chainId = '1',
  owners = [],
  address = faker.finance.ethereumAddress(),
  threshold = 1,
}: {
  chainId?: string
  owners?: string[]
  address?: string
  threshold?: number
} = {}): SafeOverview {
  return {
    address: { value: address, name: null, logoUri: null },
    chainId,
    threshold,
    owners: owners.map((value) => ({ value, name: null, logoUri: null })),
    fiatTotal: '0',
    queued: 0,
    awaitingConfirmation: null,
  }
}

export function generateSigner(value: string = faker.finance.ethereumAddress()): Signer {
  return { value, name: null, logoUri: null, type: 'private-key' }
}

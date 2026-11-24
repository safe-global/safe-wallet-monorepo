import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { QueueStatus } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import { getChainKey } from './queueGroups'
import type { QueueListItem } from './queueList'
import { findTargetIndex } from './queueNavigation'

const safeAddress = checksumAddress(faker.finance.ethereumAddress())
const chainId = '1'

const row = (nonce: number, status: QueueStatus): QueueListItem => ({
  kind: 'transaction',
  key: faker.string.uuid(),
  scopeKey: getChainKey(safeAddress, chainId),
  safeAddress,
  chainId,
  item: {
    type: 'TRANSACTION',
    conflictType: 'None',
    transaction: { id: faker.string.uuid(), executionInfo: { type: 'MULTISIG', nonce } },
  } as TransactionQueuedItem,
  status,
  canReject: true,
})

describe('findTargetIndex', () => {
  const items = [row(3, 'waiting'), row(3, 'sign'), row(3, 'execute'), row(4, 'blocked')]

  it('prefers the option in the status asked for', () => {
    expect(findTargetIndex(items, { safeAddress, chainId, nonce: 3, status: 'sign' })).toBe(1)
    expect(findTargetIndex(items, { safeAddress, chainId, nonce: 3, status: 'execute' })).toBe(2)
  })

  it('falls back to the first option', () => {
    expect(findTargetIndex(items, { safeAddress, chainId, nonce: 3, status: 'blocked' })).toBe(0)
    expect(findTargetIndex(items, { safeAddress, chainId, nonce: 3 })).toBe(0)
  })

  it('finds nothing on another chain', () => {
    expect(findTargetIndex(items, { safeAddress, chainId: '137', nonce: 3 })).toBe(-1)
  })
})

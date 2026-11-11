import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SpaceQueueSection } from '../../../store/spaceQueueApi'
import { buildQueueList, getChainKey, groupByScope } from './queueList'

const transactionItem = (nonce: number, conflictType: TransactionQueuedItem['conflictType'] = 'None') =>
  ({
    type: 'TRANSACTION',
    conflictType,
    transaction: {
      id: faker.string.uuid(),
      txStatus: 'AWAITING_EXECUTION',
      txInfo: { type: 'Custom', isCancellation: false },
      executionInfo: { type: 'MULTISIG', nonce, confirmationsRequired: 1, confirmationsSubmitted: 1 },
    },
  }) as TransactionQueuedItem

describe('buildQueueList', () => {
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())
  const sections: SpaceQueueSection[] = [
    {
      safeAddress: safeA,
      chains: [
        {
          chainId: '1',
          items: [
            { type: 'LABEL', label: 'Next' },
            { type: 'CONFLICT_HEADER', nonce: 3 },
            transactionItem(3, 'HasNext'),
            transactionItem(3, 'End'),
          ],
        },
        { chainId: '137', items: [{ type: 'LABEL', label: 'Next' }, transactionItem(8)] },
      ],
    },
    { safeAddress: safeB, chains: [{ chainId: '1', items: [{ type: 'LABEL', label: 'Next' }, transactionItem(1)] }] },
  ]
  const none = new Set<string>()

  it('lists a band per Safe, a header per chain, conflict headers and transactions in order', () => {
    const list = buildQueueList({ sections, collapsedSafes: none, collapsedChains: none })

    expect(list.map((item) => item.kind)).toEqual([
      'safe',
      'chain',
      'conflict',
      'transaction',
      'transaction',
      'chain',
      'transaction',
      'safe',
      'chain',
      'transaction',
    ])
    expect(list[3]).toMatchObject({ kind: 'transaction', status: 'execute', nextNonce: 3, conflict: { option: 1 } })
  })

  it('leaves out every row of a collapsed Safe but its band, which summarises it', () => {
    const list = buildQueueList({
      sections,
      collapsedSafes: new Set([safeA.toLowerCase()]),
      collapsedChains: none,
    })

    expect(list.map((item) => item.kind)).toEqual(['safe', 'safe', 'chain', 'transaction'])
    expect(list[0]).toMatchObject({ collapsed: true, summary: '3 to execute' })
  })

  it('leaves out the rows of a collapsed chain but keeps its header', () => {
    const list = buildQueueList({
      sections: [sections[0]],
      collapsedSafes: none,
      collapsedChains: new Set([getChainKey(safeA, '1')]),
    })

    expect(list.map((item) => item.kind)).toEqual(['safe', 'chain', 'chain', 'transaction'])
    expect(list[1]).toMatchObject({ kind: 'chain', chainId: '1', collapsed: true })
  })

  it('gives every row a unique key', () => {
    const list = buildQueueList({ sections, collapsedSafes: none, collapsedChains: none })

    expect(new Set(list.map((item) => item.key)).size).toBe(list.length)
  })
})

describe('groupByScope', () => {
  it('groups consecutive rows of one Safe and chain, and leaves bands on their own', () => {
    const safe = checksumAddress(faker.finance.ethereumAddress())
    const list = buildQueueList({
      sections: [
        {
          safeAddress: safe,
          chains: [
            { chainId: '1', items: [transactionItem(1), transactionItem(2)] },
            { chainId: '10', items: [transactionItem(4)] },
          ],
        },
      ],
      collapsedSafes: new Set(),
      collapsedChains: new Set(),
    })

    const groups = groupByScope(list.map((item) => ({ item })))

    expect(groups.map((group) => [group.scopeKey, group.entries.length])).toEqual([
      [undefined, 1],
      [getChainKey(safe, '1'), 3],
      [getChainKey(safe, '10'), 2],
    ])
  })
})

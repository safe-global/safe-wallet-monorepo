import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SpaceQueueSection } from '../../../store/spaceQueueApi'
import { getChainKey, getQueueGroups, getQueueUnits } from './queueGroups'
import { buildGroupedQueueList, buildQueueList } from './queueList'

const PROPOSED_AT = faker.date.past().getTime()

const transactionItem = (nonce: number, conflictType: TransactionQueuedItem['conflictType'] = 'None') =>
  ({
    type: 'TRANSACTION',
    conflictType,
    transaction: {
      id: faker.string.uuid(),
      timestamp: PROPOSED_AT,
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
  const signers = new Set<string>()

  it('lists a band per Safe, a header per chain, conflict headers and transactions in order', () => {
    const list = buildQueueList({ sections, collapsedSafes: none, collapsedChains: none, signers })

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
      signers,
    })

    expect(list.map((item) => item.kind)).toEqual(['safe', 'safe', 'chain', 'transaction'])
    expect(list[0]).toMatchObject({ collapsed: true, summary: '3 to execute' })
  })

  it('leaves out the rows of a collapsed chain but keeps its header', () => {
    const list = buildQueueList({
      sections: [sections[0]],
      collapsedSafes: none,
      collapsedChains: new Set([getChainKey(safeA, '1')]),
      signers,
    })

    expect(list.map((item) => item.kind)).toEqual(['safe', 'chain', 'chain', 'transaction'])
    expect(list[1]).toMatchObject({ kind: 'chain', chainId: '1', collapsed: true })
  })

  it('gives every row a unique key', () => {
    const list = buildQueueList({ sections, collapsedSafes: none, collapsedChains: none, signers })

    expect(new Set(list.map((item) => item.key)).size).toBe(list.length)
  })
})

describe('buildGroupedQueueList', () => {
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
      ],
    },
    { safeAddress: safeB, chains: [{ chainId: '137', items: [{ type: 'LABEL', label: 'Next' }, transactionItem(1)] }] },
  ]
  const units = getQueueUnits(sections, new Set())
  const none = new Set<string>()

  it('puts a band with its transaction count before each group, and names the Safe on every row', () => {
    const list = buildGroupedQueueList({ groups: getQueueGroups(units, 'network'), collapsedGroups: none })

    expect(list.map((item) => item.kind)).toEqual([
      'group',
      'conflict',
      'transaction',
      'transaction',
      'group',
      'transaction',
    ])
    expect(list[0]).toMatchObject({ kind: 'group', group: 'network', chainId: '1', count: 2, collapsed: false })
    expect(list.filter((item) => item.kind === 'transaction').every((item) => item.showSafe)).toBe(true)
  })

  it('lists the Status view without bands', () => {
    const list = buildGroupedQueueList({ groups: getQueueGroups(units, 'status'), collapsedGroups: none })

    expect(list.map((item) => item.kind)).toEqual(['conflict', 'transaction', 'transaction', 'transaction'])
  })

  it('leaves out the rows of a collapsed group but keeps its band', () => {
    const list = buildGroupedQueueList({
      groups: getQueueGroups(units, 'network'),
      collapsedGroups: new Set(['network-1']),
    })

    expect(list.map((item) => item.kind)).toEqual(['group', 'group', 'transaction'])
    expect(list[0]).toMatchObject({ id: 'network-1', collapsed: true })
  })

  it('gives every row a unique key', () => {
    const list = buildGroupedQueueList({ groups: getQueueGroups(units, 'next'), collapsedGroups: none })

    expect(new Set(list.map((item) => item.key)).size).toBe(list.length)
  })
})

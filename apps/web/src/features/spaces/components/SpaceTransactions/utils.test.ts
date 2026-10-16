import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type {
  SpaceQueuedItemPage,
  SpaceQueueSafeItems,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { getNextCursor, mergeQueueRuns } from './utils'

const transactionItem = (): TransactionQueuedItem =>
  ({ type: 'TRANSACTION', transaction: { id: faker.string.uuid() } }) as TransactionQueuedItem

const run = (chainId: string, safeAddress: string, items: SpaceQueueSafeItems['items']): SpaceQueueSafeItems => ({
  chainId,
  safeAddress,
  items,
})

const page = (results: SpaceQueueSafeItems[]): SpaceQueuedItemPage => ({
  count: results.length,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
})

describe('getNextCursor', () => {
  it('returns the cursor of a next URL', () => {
    expect(getNextCursor('https://cgw.test/v1/spaces/1/transactions/queued?cursor=limit%3D20%26offset%3D23')).toBe(
      'limit=20&offset=23',
    )
  })

  it('returns undefined without a next URL', () => {
    expect(getNextCursor(null)).toBeUndefined()
    expect(getNextCursor(undefined)).toBeUndefined()
  })
})

describe('mergeQueueRuns', () => {
  const chainId = faker.string.numeric(3)
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())

  it('keeps runs of different Safes apart, in order', () => {
    const a = run(chainId, safeA, [transactionItem()])
    const b = run(chainId, safeB, [transactionItem()])

    expect(mergeQueueRuns([page([a, b])])).toEqual([a, b])
  })

  it('merges a run that continues on the next page and drops its repeated label', () => {
    const first = transactionItem()
    const second = transactionItem()
    const pageOne = page([run(chainId, safeA, [{ type: 'LABEL', label: 'Queued' }, first])])
    const pageTwo = page([run(chainId, safeA.toLowerCase(), [{ type: 'LABEL', label: 'Queued' }, second])])

    expect(mergeQueueRuns([pageOne, pageTwo])).toEqual([
      run(chainId, safeA, [{ type: 'LABEL', label: 'Queued' }, first, second]),
    ])
  })

  it('does not merge the same address on another chain', () => {
    const a = run(chainId, safeA, [transactionItem()])
    const otherChain = run(faker.string.numeric(4), safeA, [transactionItem()])

    expect(mergeQueueRuns([page([a]), page([otherChain])])).toEqual([a, otherChain])
  })
})

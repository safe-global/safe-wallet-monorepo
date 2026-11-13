import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { SpaceQueueChain, SpaceQueueSection } from '../../../store/spaceQueueApi'
import { getQueueGroups, getQueueUnits, type QueueGroup } from './queueGroups'

const ME = checksumAddress(faker.finance.ethereumAddress())
const OTHER_SIGNER = checksumAddress(faker.finance.ethereumAddress())
const SIGNERS = new Set([ME.toLowerCase()])
const PROPOSED_AT = faker.date.past().getTime()
const HOUR = 60 * 60 * 1000

type TxOptions = {
  status?: TransactionQueuedItem['transaction']['txStatus']
  submitted?: number
  missing?: string[]
  proposedAt?: number
  conflictType?: TransactionQueuedItem['conflictType']
}

const tx = (
  nonce: number,
  {
    status = 'AWAITING_CONFIRMATIONS',
    submitted = 0,
    missing = [],
    proposedAt = PROPOSED_AT,
    conflictType = 'None',
  }: TxOptions = {},
): TransactionQueuedItem =>
  ({
    type: 'TRANSACTION',
    conflictType,
    transaction: {
      id: faker.string.uuid(),
      timestamp: proposedAt,
      txStatus: status,
      txInfo: { type: 'Custom', isCancellation: false },
      executionInfo: {
        type: 'MULTISIG',
        nonce,
        confirmationsRequired: 2,
        confirmationsSubmitted: submitted,
        missingSigners: missing.map((value) => ({ value })),
      },
    },
  }) as TransactionQueuedItem

const toExecute = (nonce: number, options?: TxOptions) =>
  tx(nonce, { ...options, status: 'AWAITING_EXECUTION', submitted: 2 })
const forMe = (nonce: number, submitted: number, options?: TxOptions) =>
  tx(nonce, { ...options, submitted, missing: [ME] })
const forOthers = (nonce: number, options?: TxOptions) => tx(nonce, { ...options, missing: [OTHER_SIGNER] })

const chain = (
  chainId: string,
  next: TransactionQueuedItem[],
  queued: TransactionQueuedItem[] = [],
): SpaceQueueChain => ({
  chainId,
  items: [
    { type: 'LABEL', label: 'Next' },
    ...next,
    ...(queued.length > 0 ? [{ type: 'LABEL' as const, label: 'Queued' as const }, ...queued] : []),
  ],
})

const safe = (...chains: SpaceQueueChain[]): SpaceQueueSection => ({
  safeAddress: checksumAddress(faker.finance.ethereumAddress()),
  chains,
})

const ids = (groups: QueueGroup[]) =>
  groups.map((group) => group.units.flatMap((unit) => unit.transactions.map(({ item }) => item.transaction.id)))

const idsOf = (...items: TransactionQueuedItem[]) => items.map((item) => item.transaction.id)

const group = (sections: SpaceQueueSection[], groupBy: 'status' | 'next' | 'network') =>
  getQueueGroups(getQueueUnits(sections, SIGNERS), groupBy)

describe('getQueueGroups', () => {
  describe('status', () => {
    it('lists what can execute, then my last signatures, my other signatures, waiting at the next nonce, then the rest', () => {
      const signAndExecute = forMe(1, 1)
      const blocked = toExecute(2)
      const sign = forMe(3, 0)
      const execute = toExecute(5)
      const waitingBehind = forOthers(6)
      const waitingNext = forOthers(0)
      const sections = [
        safe(chain('1', [signAndExecute], [blocked, sign])),
        safe(chain('1', [execute], [waitingBehind])),
        safe(chain('10', [waitingNext])),
      ]

      const groups = group(sections, 'status')

      expect(ids(groups)).toEqual([idsOf(execute, signAndExecute, sign, waitingNext, blocked, waitingBehind)])
    })

    it('lists the oldest first among transactions equally urgent', () => {
      const recent = toExecute(4, { proposedAt: PROPOSED_AT })
      const older = toExecute(9, { proposedAt: PROPOSED_AT - HOUR })

      const groups = group([safe(chain('1', [recent])), safe(chain('1', [older]))], 'status')

      expect(ids(groups)).toEqual([idsOf(older, recent)])
    })

    it('keeps the options sharing a nonce together, where their most urgent option ranks', () => {
      const execute = toExecute(1)
      const waitingOption = forOthers(7, { conflictType: 'HasNext' })
      const signOption = forMe(7, 0, { conflictType: 'End' })
      const blocked = toExecute(9)
      const sections = [
        safe({
          chainId: '1',
          items: [{ type: 'LABEL', label: 'Next' }, { type: 'CONFLICT_HEADER', nonce: 7 }, waitingOption, signOption],
        }),
        safe(chain('1', [execute], [blocked])),
      ]

      const groups = group(sections, 'status')

      expect(ids(groups)).toEqual([idsOf(execute, waitingOption, signOption, blocked)])
      expect(groups[0].units[1].conflict).toEqual({ nonce: 7, size: 2 })
    })
  })

  describe('network', () => {
    it('groups by network in the order the first Safes list them, each in Safe and nonce order', () => {
      const firstOnGnosis = forOthers(1)
      const firstOnMainnet = forOthers(4)
      const secondOnMainnet = forOthers(2)
      const sections = [
        safe(chain('100', [firstOnGnosis]), chain('1', [firstOnMainnet])),
        safe(chain('1', [secondOnMainnet])),
      ]

      const groups = group(sections, 'network')

      expect(groups.map(({ kind, chainId }) => ({ kind, chainId }))).toEqual([
        { kind: 'network', chainId: '100' },
        { kind: 'network', chainId: '1' },
      ])
      expect(ids(groups)).toEqual([idsOf(firstOnGnosis), idsOf(firstOnMainnet, secondOnMainnet)])
    })
  })

  describe('next', () => {
    it("puts each Safe's next nonce on each network in line, and the rest behind it by network", () => {
      const nextOnMainnet = forOthers(1)
      const behindOnMainnet = forOthers(2)
      const nextOnGnosis = forOthers(5)
      const behindOnGnosis = forOthers(6)
      const behindOnMainnetOtherSafe = forOthers(9)
      const sections = [
        safe(chain('1', [nextOnMainnet], [behindOnMainnet]), chain('100', [nextOnGnosis], [behindOnGnosis])),
        safe(chain('1', [], [behindOnMainnetOtherSafe])),
      ]

      const groups = group(sections, 'next')

      expect(groups.map(({ kind }) => kind)).toEqual(['next', 'behind'])
      expect(ids(groups)).toEqual([
        idsOf(nextOnMainnet, nextOnGnosis),
        idsOf(behindOnMainnet, behindOnMainnetOtherSafe, behindOnGnosis),
      ])
    })

    it('leaves out a group with no transactions', () => {
      const groups = group([safe(chain('1', [forOthers(1)])), safe(chain('1', [toExecute(3)]))], 'next')

      expect(groups.map(({ kind }) => kind)).toEqual(['next'])
    })
  })

  it('returns the groups already worked out when the same queue is grouped the same way again', () => {
    const units = getQueueUnits([safe(chain('1', [forOthers(1)], [forMe(2, 0)]))], SIGNERS)
    const byNetwork = getQueueGroups(units, 'network')

    getQueueGroups(units, 'status')

    expect(getQueueGroups(units, 'network')).toBe(byNetwork)
  })

  it('works out the units again for a new queue', () => {
    const sections = [safe(chain('1', [forOthers(1)]))]

    expect(getQueueUnits([...sections], SIGNERS)).not.toBe(getQueueUnits(sections, SIGNERS))
  })
})

import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type {
  ConflictHeaderQueuedItem,
  SpaceQueuedItemPage,
  SpaceQueueSafeItems,
  TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { getCounterparty, getNextCursor, getNextNonce, getQueueStatus, getSectionRows, groupQueueBySafe } from './utils'

const transactionItem = (
  nonce = faker.number.int({ max: 1000 }),
  conflictType: TransactionQueuedItem['conflictType'] = 'None',
): TransactionQueuedItem =>
  ({
    type: 'TRANSACTION',
    conflictType,
    transaction: {
      id: faker.string.uuid(),
      timestamp: faker.date.past().getTime(),
      executionInfo: { type: 'MULTISIG', nonce },
    },
  }) as TransactionQueuedItem

const conflictHeader = (nonce: number): ConflictHeaderQueuedItem => ({ type: 'CONFLICT_HEADER', nonce })

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

const multisigTx = (txStatus: Transaction['txStatus'], missingSigners: string[] = []): Transaction =>
  ({
    id: faker.string.uuid(),
    txStatus,
    executionInfo: {
      type: 'MULTISIG',
      nonce: faker.number.int({ max: 1000 }),
      missingSigners: missingSigners.map((value) => ({ value })),
    },
  }) as Transaction

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

describe('groupQueueBySafe', () => {
  const chainId = faker.string.numeric(3)
  const safeA = checksumAddress(faker.finance.ethereumAddress())
  const safeB = checksumAddress(faker.finance.ethereumAddress())

  it('keeps Safes apart, in order of first appearance', () => {
    const a = run(chainId, safeA, [transactionItem()])
    const b = run(chainId, safeB, [transactionItem()])

    expect(groupQueueBySafe([page([a, b])])).toEqual([a, b])
  })

  it('joins every run of a Safe, across pages and between other Safes, and drops repeated labels', () => {
    const first = transactionItem()
    const second = transactionItem()
    const third = transactionItem()
    const other = run(chainId, safeB, [transactionItem()])
    const pageOne = page([run(chainId, safeA, [{ type: 'LABEL', label: 'Queued' }, first]), other])
    const pageTwo = page([
      run(chainId, safeA.toLowerCase(), [{ type: 'LABEL', label: 'Queued' }, second]),
      run(chainId, safeA, [third]),
    ])

    expect(groupQueueBySafe([pageOne, pageTwo])).toEqual([
      run(chainId, safeA, [{ type: 'LABEL', label: 'Queued' }, first, second, third]),
      other,
    ])
  })

  it('does not join the same address on another chain', () => {
    const a = run(chainId, safeA, [transactionItem()])
    const otherChain = run(faker.string.numeric(4), safeA, [transactionItem()])

    expect(groupQueueBySafe([page([a]), page([otherChain])])).toEqual([a, otherChain])
  })
})

describe('getSectionRows', () => {
  it('marks the transactions under the "Next" label and drops the labels', () => {
    const next = transactionItem(4)
    const queued = transactionItem(5)

    expect(
      getSectionRows([{ type: 'LABEL', label: 'Next' }, next, { type: 'LABEL', label: 'Queued' }, queued]),
    ).toEqual([
      { kind: 'transaction', item: next, isNext: true, inConflict: false },
      { kind: 'transaction', item: queued, isNext: false, inConflict: false },
    ])
  })

  it('puts a header row with the nonce and size before transactions that share a nonce', () => {
    const optionA = transactionItem(7, 'HasNext')
    const optionB = transactionItem(7, 'End')
    const rows = getSectionRows([{ type: 'LABEL', label: 'Next' }, conflictHeader(7), optionA, optionB])

    expect(rows[0]).toEqual({ kind: 'conflict', nonce: 7, size: 2 })
    expect(rows.slice(1)).toEqual(
      expect.arrayContaining([
        { kind: 'transaction', item: optionA, isNext: true, inConflict: true },
        { kind: 'transaction', item: optionB, isNext: true, inConflict: true },
      ]),
    )
  })
})

describe('getNextNonce', () => {
  it('returns the nonce of the first transaction under "Next"', () => {
    const rows = getSectionRows([{ type: 'LABEL', label: 'Next' }, transactionItem(12)])

    expect(getNextNonce(rows)).toBe(12)
  })

  it('returns undefined when no loaded transaction is next', () => {
    const rows = getSectionRows([{ type: 'LABEL', label: 'Queued' }, transactionItem(12)])

    expect(getNextNonce(rows)).toBeUndefined()
  })
})

describe('getCounterparty', () => {
  const party = () => ({ value: checksumAddress(faker.finance.ethereumAddress()), name: faker.person.fullName() })

  it('is the recipient of an outgoing transfer and the sender of an incoming one', () => {
    const sender = party()
    const recipient = party()
    const transfer = (direction: string) =>
      ({
        type: 'Transfer',
        direction,
        sender,
        recipient,
        transferInfo: { type: 'NATIVE_COIN', value: '1' },
      }) as TransactionInfo

    expect(getCounterparty(transfer('OUTGOING'))).toEqual({ join: 'to', party: recipient })
    expect(getCounterparty(transfer('INCOMING'))).toEqual({ join: 'from', party: sender })
  })

  it('is the contract a batch goes through, or the contract a call goes to', () => {
    const to = party()

    expect(getCounterparty({ type: 'Custom', methodName: 'multiSend', to } as TransactionInfo)).toEqual({
      join: 'via',
      party: to,
    })
    expect(getCounterparty({ type: 'Custom', methodName: 'approve', to } as TransactionInfo)).toEqual({
      join: 'to',
      party: to,
    })
  })

  it('has no other party for a settings change', () => {
    expect(getCounterparty({ type: 'SettingsChange' } as TransactionInfo)).toBeUndefined()
  })
})

describe('getQueueStatus', () => {
  const wallet = checksumAddress(faker.finance.ethereumAddress())

  it('is execute for the next transaction awaiting execution, blocked for a later one', () => {
    const tx = multisigTx('AWAITING_EXECUTION')

    expect(getQueueStatus(tx, true, wallet)).toBe('execute')
    expect(getQueueStatus(tx, false, wallet)).toBe('blocked')
  })

  it('is sign when the connected wallet is a missing signer, waiting otherwise', () => {
    expect(getQueueStatus(multisigTx('AWAITING_CONFIRMATIONS', [wallet]), true, wallet)).toBe('sign')
    expect(getQueueStatus(multisigTx('AWAITING_CONFIRMATIONS'), true, wallet)).toBe('waiting')
    expect(getQueueStatus(multisigTx('AWAITING_CONFIRMATIONS', [wallet]), true, undefined)).toBe('waiting')
  })
})

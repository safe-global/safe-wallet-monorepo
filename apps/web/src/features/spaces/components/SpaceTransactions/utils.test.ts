import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { ConflictHeaderQueuedItem, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import { getCounterparty, getNextNonce, getQueueStatus, getSectionRows } from './utils'

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

describe('getSectionRows', () => {
  it('marks the transactions under the "Next" label and drops the labels', () => {
    const next = transactionItem(4)
    const queued = transactionItem(5)

    expect(
      getSectionRows([{ type: 'LABEL', label: 'Next' }, next, { type: 'LABEL', label: 'Queued' }, queued]),
    ).toEqual([
      { kind: 'transaction', item: next, isNext: true },
      { kind: 'transaction', item: queued, isNext: false },
    ])
  })

  it('puts a header row with the nonce and size before transactions that share a nonce, and numbers them', () => {
    const optionA = transactionItem(7, 'HasNext')
    const optionB = transactionItem(7, 'End')
    const rows = getSectionRows([{ type: 'LABEL', label: 'Next' }, conflictHeader(7), optionA, optionB])

    expect(rows[0]).toEqual({ kind: 'conflict', nonce: 7, size: 2 })
    expect(rows.slice(1).map((row) => (row.kind === 'transaction' ? row.conflict : undefined))).toEqual([
      { option: 1, size: 2 },
      { option: 2, size: 2 },
    ])
    expect(rows.slice(1).map((row) => (row.kind === 'transaction' ? row.item : undefined))).toEqual(
      expect.arrayContaining([optionA, optionB]),
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

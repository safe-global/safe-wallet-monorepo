import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { ConflictHeaderQueuedItem, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionInfo } from '@safe-global/store/gateway/types'
import {
  getCounterparty,
  getNextNonce,
  getQueueStatus,
  getQueueTypeLabel,
  getRejectedNonces,
  getSectionRows,
  getSettingsSummary,
} from './utils'

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

  it('is the contract a batch goes through, or the contract a call happens on', () => {
    const to = party()

    expect(getCounterparty({ type: 'Custom', methodName: 'multiSend', to } as TransactionInfo)).toEqual({
      join: 'via',
      party: to,
    })
    expect(getCounterparty({ type: 'Custom', methodName: 'approve', to } as TransactionInfo)).toEqual({
      join: 'on',
      party: to,
    })
  })

  it('names the protocol of a bridge or a swap, which the list response has no address for', () => {
    expect(getCounterparty({ type: 'SwapAndBridge' } as TransactionInfo)).toEqual({ join: 'via', protocol: 'LI.FI' })
    expect(getCounterparty({ type: 'Swap' } as TransactionInfo)).toEqual({ join: 'on', protocol: 'LI.FI' })
    expect(getCounterparty({ type: 'SwapOrder' } as TransactionInfo)).toEqual({ join: 'on', protocol: 'CoW Protocol' })
    expect(getCounterparty({ type: 'TwapOrder' } as TransactionInfo)).toEqual({ join: 'on', protocol: 'CoW Protocol' })
  })

  it('has no other party for a settings change or an on-chain rejection', () => {
    expect(getCounterparty({ type: 'SettingsChange' } as TransactionInfo)).toBeUndefined()
    expect(
      getCounterparty({ type: 'Custom', isCancellation: true, to: party(), dataSize: '0' } as TransactionInfo),
    ).toBeUndefined()
  })
})

describe('getQueueTypeLabel', () => {
  const to = { value: checksumAddress(faker.finance.ethereumAddress()), name: 'Uniswap Router' }
  const withInfo = (txInfo: Partial<Transaction['txInfo']>, extra: Partial<Transaction> = {}): Transaction =>
    ({ executionInfo: { type: 'MULTISIG' }, txInfo, ...extra }) as Transaction

  it('tags settings changes as Settings and contract calls as Contract', () => {
    expect(getQueueTypeLabel(withInfo({ type: 'SettingsChange' }))).toBe('Settings')
    expect(getQueueTypeLabel(withInfo({ type: 'Custom', methodName: 'swap', to, isCancellation: false }))).toBe(
      'Contract',
    )
  })

  it('tags an approveHash on a parent Safe as Nested', () => {
    expect(
      getQueueTypeLabel(
        withInfo({ type: 'Custom', methodName: 'approveHash', to, isCancellation: false, dataSize: '36' }),
      ),
    ).toBe('Nested')
  })

  it('keeps the shared type for batches, rejections, Safe App transactions and transfers', () => {
    expect(getQueueTypeLabel(withInfo({ type: 'Custom', methodName: 'multiSend', to, isCancellation: false }))).toBe(
      undefined,
    )
    expect(getQueueTypeLabel(withInfo({ type: 'Custom', to, isCancellation: true, dataSize: '0' }))).toBeUndefined()
    expect(
      getQueueTypeLabel(
        withInfo(
          { type: 'Custom', methodName: 'swap', to, isCancellation: false },
          { safeAppInfo: { id: 1, name: 'CoW Swap', url: 'https://swap.cow.fi' } },
        ),
      ),
    ).toBeUndefined()
    expect(getQueueTypeLabel(withInfo({ type: 'Transfer' }))).toBeUndefined()
  })
})

describe('getSettingsSummary', () => {
  const summary = (settingsInfo: object) =>
    getSettingsSummary({ type: 'SettingsChange', dataDecoded: { method: 'raw' }, settingsInfo } as never)
  const owner = { value: '0x1234567890123456789012345678901234567890' }

  it('describes the change with the address book name, or the short address', () => {
    expect(summary({ type: 'ADD_OWNER', owner: { ...owner, name: 'Priya' }, threshold: 2 })).toBe('Add signer Priya')
    expect(summary({ type: 'REMOVE_OWNER', owner, threshold: 1 })).toBe('Remove signer 0x1234...7890')
    expect(summary({ type: 'CHANGE_THRESHOLD', threshold: 3 })).toBe('Change threshold to 3')
    expect(summary({ type: 'ENABLE_MODULE', module: { ...owner, name: 'Zodiac Roles' } })).toBe(
      'Enable module Zodiac Roles',
    )
    expect(summary({ type: 'DELETE_GUARD' })).toBe('Remove guard')
  })

  it('falls back to the method name for a change it has no words for', () => {
    expect(summary(undefined as never)).toBe('raw')
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

describe('getRejectedNonces', () => {
  const withTxInfo = (nonce: number, txInfo: Partial<Transaction['txInfo']>): TransactionQueuedItem => {
    const item = transactionItem(nonce)
    return { ...item, transaction: { ...item.transaction, txInfo: txInfo as Transaction['txInfo'] } }
  }

  it('collects the nonces held by an on-chain rejection', () => {
    const rows = getSectionRows([
      { type: 'LABEL', label: 'Next' },
      conflictHeader(3),
      withTxInfo(3, { type: 'Custom', isCancellation: false } as Partial<Transaction['txInfo']>),
      {
        ...withTxInfo(3, { type: 'Custom', isCancellation: true } as Partial<Transaction['txInfo']>),
        conflictType: 'End',
      },
      withTxInfo(4, { type: 'Custom', isCancellation: false } as Partial<Transaction['txInfo']>),
    ])

    expect(getRejectedNonces(rows)).toEqual(new Set([3]))
  })
})

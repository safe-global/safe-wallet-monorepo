import { faker } from '@faker-js/faker'
import type { MultiSend, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import { getLatestSpendingLimitAddress } from '@/features/spending-limits/services'
import { getSpendingLimitBatch } from '../spendingLimitBatch'

const CHAIN_ID = '11155111'
const MODULE = getLatestSpendingLimitAddress(CHAIN_ID)!
const SAFE = faker.finance.ethereumAddress()
const SPENDER = faker.finance.ethereumAddress()
const TOKEN = faker.finance.ethereumAddress()

const action = (method: string, values: string[], to = MODULE): MultiSend => ({
  operation: Operation.CALL,
  to,
  value: '0',
  data: '0x',
  dataDecoded: { method, parameters: values.map((value) => ({ name: '', type: 'address', value })) },
})

const multiSend = (actions: MultiSend[]): TransactionData => ({
  to: { value: faker.finance.ethereumAddress() },
  operation: Operation.DELEGATE,
  dataDecoded: {
    method: 'multiSend',
    parameters: [{ name: 'transactions', type: 'bytes', value: '0x', valueDecoded: actions }],
  },
})

describe('getSpendingLimitBatch', () => {
  it('reads a policy batch as its allowance changes', () => {
    const setAllowance = action('setAllowance', [SPENDER, TOKEN, '1000', '1440', '0'])

    const batch = getSpendingLimitBatch(
      multiSend([action('addDelegate', [SPENDER]), action('resetAllowance', [SPENDER, TOKEN]), setAllowance]),
      CHAIN_ID,
    )

    expect(batch).toEqual({
      enablesModule: false,
      changes: [{ method: 'setAllowance', dataDecoded: setAllowance.dataDecoded, resetsSpent: true }],
      removedSpenders: [],
    })
  })

  it('does not mark a set as reset when the reset targets another token', () => {
    const batch = getSpendingLimitBatch(
      multiSend([
        action('resetAllowance', [SPENDER, faker.finance.ethereumAddress()]),
        action('setAllowance', [SPENDER, TOKEN, '1000', '0', '0']),
      ]),
      CHAIN_ID,
    )

    expect(batch?.changes[0].resetsSpent).toBe(false)
  })

  it('flags the enableModule of the allowance module', () => {
    const batch = getSpendingLimitBatch(
      multiSend([
        action('enableModule', [MODULE], SAFE),
        action('addDelegate', [SPENDER]),
        action('setAllowance', [SPENDER, TOKEN, '1000', '0', '0']),
      ]),
      CHAIN_ID,
    )

    expect(batch?.enablesModule).toBe(true)
  })

  it('collects deleted allowances and removed spenders', () => {
    const batch = getSpendingLimitBatch(
      multiSend([action('deleteAllowance', [SPENDER, TOKEN]), action('removeDelegate', [SPENDER, 'false'])]),
      CHAIN_ID,
    )

    expect(batch?.changes.map(({ method }) => method)).toEqual(['deleteAllowance'])
    expect(batch?.removedSpenders).toEqual([SPENDER])
  })

  it('ignores a batch with any action outside the allowance module', () => {
    const batch = getSpendingLimitBatch(
      multiSend([
        action('setAllowance', [SPENDER, TOKEN, '1000', '0', '0']),
        action('transfer', [SPENDER, '1'], TOKEN),
      ]),
      CHAIN_ID,
    )

    expect(batch).toBeUndefined()
  })

  it('ignores enableModule of another module', () => {
    const batch = getSpendingLimitBatch(
      multiSend([
        action('enableModule', [faker.finance.ethereumAddress()], SAFE),
        action('setAllowance', [SPENDER, TOKEN, '1000', '0', '0']),
      ]),
      CHAIN_ID,
    )

    expect(batch).toBeUndefined()
  })

  it('ignores an undecoded action', () => {
    const batch = getSpendingLimitBatch(
      multiSend([
        action('setAllowance', [SPENDER, TOKEN, '1000', '0', '0']),
        { ...action('x', []), dataDecoded: undefined },
      ]),
      CHAIN_ID,
    )

    expect(batch).toBeUndefined()
  })

  it('ignores a batch that only registers spenders', () => {
    expect(getSpendingLimitBatch(multiSend([action('addDelegate', [SPENDER])]), CHAIN_ID)).toBeUndefined()
  })

  it('ignores a call that is not a multiSend', () => {
    const txData = { ...multiSend([]), dataDecoded: { method: 'setAllowance', parameters: [] } }

    expect(getSpendingLimitBatch(txData, CHAIN_ID)).toBeUndefined()
    expect(getSpendingLimitBatch(undefined, CHAIN_ID)).toBeUndefined()
  })
})

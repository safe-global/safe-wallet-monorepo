import { faker } from '@faker-js/faker'
import { parseUnits } from 'ethers'
import { UNLIMITED_APPROVAL_AMOUNT, UNLIMITED_PERMIT2_AMOUNT } from '@safe-global/utils/utils/tokens'
import { TokenType } from '@safe-global/store/gateway/types'
import {
  ERC20_INTERFACE,
  formatApprovalAmount,
  isUnlimitedApproval,
  parseApprovalAmount,
  PSEUDO_APPROVAL_VALUES,
  updateApprovalTxs,
  type ApprovalInfo,
} from '../approvals'

const createApprovalInfo = (overrides: Partial<ApprovalInfo> = {}): ApprovalInfo => {
  const tokenAddress = faker.finance.ethereumAddress()
  return {
    tokenInfo: {
      address: tokenAddress,
      symbol: 'TST',
      decimals: 18,
      type: TokenType.ERC20,
    },
    tokenAddress,
    spender: faker.finance.ethereumAddress(),
    amount: parseUnits('100', 18),
    amountFormatted: '100',
    method: 'approve',
    transactionIndex: 0,
    ...overrides,
  }
}

const encodeApprove = (spender: string, amount: bigint) =>
  ERC20_INTERFACE.encodeFunctionData('approve', [spender, amount])

const encodeIncreaseAllowance = (spender: string, amount: bigint) =>
  ERC20_INTERFACE.encodeFunctionData('increaseAllowance', [spender, amount])

describe('formatApprovalAmount', () => {
  it('formats unlimited amounts as the unlimited pseudo value', () => {
    expect(formatApprovalAmount(UNLIMITED_APPROVAL_AMOUNT, 6)).toEqual(PSEUDO_APPROVAL_VALUES.UNLIMITED)
    expect(formatApprovalAmount(UNLIMITED_PERMIT2_AMOUNT, 6)).toEqual(PSEUDO_APPROVAL_VALUES.UNLIMITED)
  })

  it('formats finite amounts with the token decimals, defaulting to 18', () => {
    expect(formatApprovalAmount(1_500_000n, 6)).toEqual('1.5')
    expect(formatApprovalAmount(parseUnits('2', 18), undefined)).toEqual('2')
  })
})

describe('isUnlimitedApproval', () => {
  it('detects both unlimited sentinels', () => {
    expect(isUnlimitedApproval(UNLIMITED_APPROVAL_AMOUNT)).toBe(true)
    expect(isUnlimitedApproval(UNLIMITED_PERMIT2_AMOUNT)).toBe(true)
    expect(isUnlimitedApproval(parseUnits('100', 18))).toBe(false)
  })
})

describe('parseApprovalAmount', () => {
  it('returns the unlimited amount for the unlimited pseudo value', () => {
    expect(parseApprovalAmount(PSEUDO_APPROVAL_VALUES.UNLIMITED, 18)).toEqual(UNLIMITED_APPROVAL_AMOUNT)
  })

  it('parses decimal amounts with the token decimals', () => {
    expect(parseApprovalAmount('1.5', 6)).toEqual(1_500_000n)
    expect(parseApprovalAmount('100', 18)).toEqual(parseUnits('100', 18))
  })

  it('throws for finite amounts without token decimals', () => {
    expect(() => parseApprovalAmount('1.5', undefined)).toThrow('Cannot parse an approval amount')
    expect(parseApprovalAmount(PSEUDO_APPROVAL_VALUES.UNLIMITED, undefined)).toEqual(UNLIMITED_APPROVAL_AMOUNT)
  })
})

describe('updateApprovalTxs', () => {
  it('re-encodes an approve call with the new amount', () => {
    const approval = createApprovalInfo()
    const txs = [{ to: approval.tokenAddress, value: '0', data: encodeApprove(approval.spender, approval.amount) }]

    const result = updateApprovalTxs(['200'], [approval], txs)

    expect(result).toEqual([
      {
        to: approval.tokenAddress,
        value: '0',
        data: encodeApprove(approval.spender, parseUnits('200', 18)),
      },
    ])
  })

  it('re-encodes an increaseAllowance call with the new amount', () => {
    const approval = createApprovalInfo({ method: 'increaseAllowance' })
    const txs = [
      { to: approval.tokenAddress, value: '0', data: encodeIncreaseAllowance(approval.spender, approval.amount) },
    ]

    const result = updateApprovalTxs(['0.5'], [approval], txs)

    expect(result).toEqual([
      {
        to: approval.tokenAddress,
        value: '0',
        data: encodeIncreaseAllowance(approval.spender, parseUnits('0.5', 18)),
      },
    ])
  })

  it('encodes the unlimited pseudo value as the unlimited amount', () => {
    const approval = createApprovalInfo()
    const txs = [{ to: approval.tokenAddress, value: '0', data: encodeApprove(approval.spender, approval.amount) }]

    const result = updateApprovalTxs([PSEUDO_APPROVAL_VALUES.UNLIMITED], [approval], txs)

    expect(result[0].data).toEqual(encodeApprove(approval.spender, UNLIMITED_APPROVAL_AMOUNT))
  })

  it('only updates the approval at its transaction index in a batch', () => {
    const approval = createApprovalInfo({ transactionIndex: 1 })
    const otherTx = { to: faker.finance.ethereumAddress(), value: '123', data: '0xbaddad' }
    const otherApproveTx = {
      to: faker.finance.ethereumAddress(),
      value: '0',
      data: encodeApprove(faker.finance.ethereumAddress(), 69n),
    }
    const approvalTx = { to: approval.tokenAddress, value: '0', data: encodeApprove(approval.spender, approval.amount) }

    const result = updateApprovalTxs(['42'], [approval], [otherTx, approvalTx, otherApproveTx])

    expect(result[0]).toEqual(otherTx)
    expect(result[1].data).toEqual(encodeApprove(approval.spender, parseUnits('42', 18)))
    // An approve call without a matching ApprovalInfo entry stays untouched
    expect(result[2]).toEqual(otherApproveTx)
  })

  it('returns the transaction unchanged without token info', () => {
    const approval = createApprovalInfo({ tokenInfo: undefined })
    const txs = [{ to: approval.tokenAddress, value: '0', data: encodeApprove(approval.spender, approval.amount) }]

    const result = updateApprovalTxs(['200'], [approval], txs)

    expect(result).toEqual(txs)
  })
})

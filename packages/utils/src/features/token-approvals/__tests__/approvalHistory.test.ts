import { faker } from '@faker-js/faker'
import { encodeMultiSendData } from '@safe-global/protocol-kit'
import { Interface, getAddress, zeroPadValue } from 'ethers'
import type { Transaction, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import {
  extractApprovals,
  extractApprovalsFromEvents,
  hasOpaqueDelegateCall,
  isApprovalCandidate,
  mergeApprovalRecords,
  needsEventCheck,
  type ApprovalRecord,
} from '../approvalHistory'

const erc20 = ERC20__factory.createInterface()
const multiSend = new Interface(['function multiSend(bytes transactions)'])

const CALL = 0
const DELEGATE_CALL = 1

const randomAddress = () => getAddress(faker.finance.ethereumAddress())

const approveData = (spender: string, amount = 1000n) => erc20.encodeFunctionData('approve', [spender, amount])

const multiSendData = (calls: { to: string; data: string; operation: number }[]) =>
  multiSend.encodeFunctionData('multiSend', [encodeMultiSendData(calls.map((call) => ({ ...call, value: '0' })))])

const buildDetails = (
  txData: { to: string; data: string; operation: number },
  overrides: Partial<TransactionDetails> = {},
): TransactionDetails =>
  ({
    safeAddress: randomAddress(),
    txId: faker.string.uuid(),
    txStatus: 'SUCCESS',
    txHash: faker.string.hexadecimal({ length: 64 }),
    txInfo: { type: 'Custom', to: { value: txData.to }, dataSize: '0', isCancellation: false },
    txData: { to: { value: txData.to }, hexData: txData.data, operation: txData.operation as 0 | 1 },
    ...overrides,
  }) as TransactionDetails

const buildSummary = (overrides: Partial<Transaction> & { txInfo: Transaction['txInfo'] }): Transaction => ({
  id: faker.string.uuid(),
  timestamp: faker.date.past().getTime(),
  txStatus: 'SUCCESS',
  ...overrides,
})

const customTxInfo = (methodName: string | null) =>
  ({ type: 'Custom', to: { value: randomAddress() }, dataSize: '68', isCancellation: false, methodName }) as const

describe('isApprovalCandidate', () => {
  it.each(['approve', 'increaseAllowance', 'decreaseAllowance', 'multiSend'])(
    'fetches the details of a successful %s call',
    (methodName) => {
      expect(isApprovalCandidate(buildSummary({ txInfo: customTxInfo(methodName) }))).toBe(true)
    },
  )

  it('fetches the details of a call the gateway could not decode', () => {
    expect(isApprovalCandidate(buildSummary({ txInfo: customTxInfo(null) }))).toBe(true)
  })

  it('skips a call to another method', () => {
    expect(isApprovalCandidate(buildSummary({ txInfo: customTxInfo('transfer') }))).toBe(false)
  })

  it('skips a transaction that did not succeed', () => {
    expect(isApprovalCandidate(buildSummary({ txInfo: customTxInfo('approve'), txStatus: 'FAILED' }))).toBe(false)
  })

  it('skips a settings change, which cannot hold an approval', () => {
    const txInfo = { type: 'SettingsChange', dataDecoded: { method: 'addOwnerWithThreshold' } } as Transaction['txInfo']

    expect(isApprovalCandidate(buildSummary({ txInfo }))).toBe(false)
  })
})

describe('extractApprovals', () => {
  it('returns the token and spender of a direct approve call', () => {
    const token = randomAddress()
    const spender = randomAddress()
    const timestamp = faker.date.past().getTime()
    const details = buildDetails({ to: token, data: approveData(spender), operation: CALL })

    expect(extractApprovals(details, timestamp)).toEqual([
      { token: { value: token }, spender: { value: spender }, txHash: details.txHash, timestamp },
    ])
  })

  it('returns every approval inside a delegatecalled MultiSend batch', () => {
    const [tokenA, tokenB, spenderA, spenderB] = [randomAddress(), randomAddress(), randomAddress(), randomAddress()]
    const data = multiSendData([
      { to: tokenA, data: approveData(spenderA), operation: CALL },
      { to: randomAddress(), data: '0x', operation: CALL },
      { to: tokenB, data: erc20.encodeFunctionData('increaseAllowance', [spenderB, 5n]), operation: CALL },
    ])

    const approvals = extractApprovals(buildDetails({ to: randomAddress(), data, operation: DELEGATE_CALL }), 1)

    expect(approvals.map(({ token, spender }) => [token.value, spender.value])).toEqual([
      [tokenA, spenderA],
      [tokenB, spenderB],
    ])
  })

  it('returns an approval inside a MultiSend nested in another MultiSend', () => {
    const [token, spender, multiSendAddress] = [randomAddress(), randomAddress(), randomAddress()]
    const inner = multiSendData([{ to: token, data: approveData(spender), operation: CALL }])
    const outer = multiSendData([{ to: multiSendAddress, data: inner, operation: DELEGATE_CALL }])

    const approvals = extractApprovals(buildDetails({ to: multiSendAddress, data: outer, operation: DELEGATE_CALL }), 1)

    expect(approvals.map(({ token, spender }) => [token.value, spender.value])).toEqual([[token, spender]])
  })

  it('returns nothing instead of throwing for a delegatecall with the multiSend selector but no valid batch', () => {
    const details = buildDetails({
      to: randomAddress(),
      data: multiSend.getFunction('multiSend')!.selector,
      operation: DELEGATE_CALL,
    })

    expect(extractApprovals(details, 1)).toEqual([])
  })

  it('ignores a MultiSend reached by a plain call, whose actions do not run as the Safe', () => {
    const data = multiSendData([{ to: randomAddress(), data: approveData(randomAddress()), operation: CALL }])

    expect(extractApprovals(buildDetails({ to: randomAddress(), data, operation: CALL }), 1)).toEqual([])
  })

  it('ignores an approve delegatecall, which changes the Safe’s own storage rather than a token’s', () => {
    const details = buildDetails({ to: randomAddress(), data: approveData(randomAddress()), operation: DELEGATE_CALL })

    expect(extractApprovals(details, 1)).toEqual([])
  })

  it('returns nothing for a failed transaction', () => {
    const details = buildDetails(
      { to: randomAddress(), data: approveData(randomAddress()), operation: CALL },
      { txStatus: 'FAILED' },
    )

    expect(extractApprovals(details, 1)).toEqual([])
  })

  it('names the token and spender from the gateway’s address and token indexes', () => {
    const token = randomAddress()
    const spender = randomAddress()
    const details = buildDetails({ to: token, data: approveData(spender), operation: CALL })
    details.txData!.addressInfoIndex = { [spender.toLowerCase()]: { value: spender, name: 'Permit2' } }
    details.txData!.tokenInfoIndex = {
      [token]: { type: 'ERC20', address: token, name: 'USD Coin', symbol: 'USDC', decimals: 6, logoUri: 'usdc.png' },
    }

    const [approval] = extractApprovals(details, 1)

    expect(approval.spender).toEqual({ value: spender, name: 'Permit2' })
    expect(approval.token).toMatchObject({ value: token, name: 'USD Coin', symbol: 'USDC', decimals: 6 })
  })
})

describe('mergeApprovalRecords', () => {
  const record = (token: string, spender: string, timestamp: number): ApprovalRecord => ({
    token: { value: token },
    spender: { value: spender },
    txHash: null,
    timestamp,
  })

  it('keeps a spender name from an older record when the newer one came from events', () => {
    const token = randomAddress()
    const spender = randomAddress()
    const decoded = { ...record(token, spender, 100), spender: { value: spender, name: 'Uniswap Permit2' } }

    const [merged] = mergeApprovalRecords([decoded, record(token, spender, 200)])

    expect(merged).toMatchObject({ timestamp: 200, spender: { value: spender, name: 'Uniswap Permit2' } })
  })

  it('keeps the latest approval per token and spender, whatever the address casing', () => {
    const token = randomAddress()
    const spender = randomAddress()
    const latest = record(token, spender, 200)

    const merged = mergeApprovalRecords([record(token.toLowerCase(), spender, 100), latest, record(token, spender, 50)])

    expect(merged).toEqual([latest])
  })
})

describe('needsEventCheck', () => {
  it('checks the events of a successful contract call whose details are not fetched', () => {
    expect(needsEventCheck(buildSummary({ txInfo: customTxInfo('execute') }))).toBe(true)
  })

  it.each(['approve', 'multiSend'])('leaves a %s call to calldata decoding', (methodName) => {
    expect(needsEventCheck(buildSummary({ txInfo: customTxInfo(methodName) }))).toBe(false)
  })

  it('skips a transaction that did not succeed', () => {
    expect(needsEventCheck(buildSummary({ txInfo: customTxInfo('execute'), txStatus: 'FAILED' }))).toBe(false)
  })
})

describe('hasOpaqueDelegateCall', () => {
  const helperCall = () => ({ to: randomAddress(), data: '0x12345678', operation: DELEGATE_CALL })

  it('is true for a delegatecall to a contract other than MultiSend', () => {
    expect(hasOpaqueDelegateCall(buildDetails(helperCall()))).toBe(true)
  })

  it('is true for such a delegatecall inside a MultiSend batch', () => {
    const data = multiSendData([
      { to: randomAddress(), data: approveData(randomAddress()), operation: CALL },
      helperCall(),
    ])

    expect(hasOpaqueDelegateCall(buildDetails({ to: randomAddress(), data, operation: DELEGATE_CALL }))).toBe(true)
  })

  it('is false for a MultiSend batch of plain calls', () => {
    const data = multiSendData([{ to: randomAddress(), data: approveData(randomAddress()), operation: CALL }])

    expect(hasOpaqueDelegateCall(buildDetails({ to: randomAddress(), data, operation: DELEGATE_CALL }))).toBe(false)
  })

  it('is false for a direct approve call', () => {
    const details = buildDetails({ to: randomAddress(), data: approveData(randomAddress()), operation: CALL })

    expect(hasOpaqueDelegateCall(details)).toBe(false)
  })
})

describe('extractApprovalsFromEvents', () => {
  const APPROVAL_TOPIC = erc20.getEvent('Approval').topicHash
  const approvalLog = (token: string, owner: string, spender: string) => ({
    address: token.toLowerCase(),
    topics: [APPROVAL_TOPIC, zeroPadValue(owner, 32), zeroPadValue(spender, 32)],
  })

  it('returns the ERC-20 approvals the Safe gave in the transaction', () => {
    const [safe, token, spender] = [randomAddress(), randomAddress(), randomAddress()]
    const meta = { txHash: faker.string.hexadecimal({ length: 64 }), timestamp: 1 }

    expect(extractApprovalsFromEvents([approvalLog(token, safe, spender)], safe, meta)).toEqual([
      { token: { value: token }, spender: { value: spender }, ...meta },
    ])
  })

  it('ignores approvals by another owner, ERC-721 approvals and other events', () => {
    const [safe, token] = [randomAddress(), randomAddress()]
    const logs = [
      approvalLog(token, randomAddress(), randomAddress()),
      {
        ...approvalLog(token, safe, randomAddress()),
        topics: [...approvalLog(token, safe, randomAddress()).topics, zeroPadValue('0x01', 32)],
      },
      {
        address: token,
        topics: [erc20.getEvent('Transfer').topicHash, zeroPadValue(safe, 32), zeroPadValue(randomAddress(), 32)],
      },
    ]

    expect(extractApprovalsFromEvents(logs, safe, { txHash: null, timestamp: 1 })).toEqual([])
  })
})

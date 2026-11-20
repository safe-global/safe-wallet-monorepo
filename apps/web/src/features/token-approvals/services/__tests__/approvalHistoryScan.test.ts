import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { getAddress, zeroPadValue } from 'ethers'
import type { Transaction, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { server } from '@/tests/server'
import { transactionDataBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore, setStoreInstance } from '@/store'
import { clearScannedHistories, scanApprovalHistory, type ScanOptions } from '../approvalHistoryScan'

const CHAIN_ID = '1'
const erc20 = ERC20__factory.createInterface()

type HistoryTx = { summary: Transaction; details: TransactionDetails }

const randomAddress = () => getAddress(faker.finance.ethereumAddress())

const historyTx = (
  methodName: string | null,
  hexData: string,
  token = randomAddress(),
  operation: 0 | 1 = 0,
): HistoryTx => {
  const id = `multisig_${faker.string.hexadecimal({ length: 64 })}`
  const txInfo: Transaction['txInfo'] = {
    type: 'Custom',
    to: { value: token },
    dataSize: '68',
    isCancellation: false,
    methodName,
  }
  return {
    summary: { id, timestamp: faker.date.past().getTime(), txStatus: 'SUCCESS', txInfo },
    details: transactionDetailsBuilder()
      .with({
        txId: id,
        txStatus: 'SUCCESS',
        txHash: faker.string.hexadecimal({ length: 64 }),
        txInfo,
        txData: transactionDataBuilder()
          .with({ to: { value: token }, hexData, operation })
          .build(),
      })
      .build(),
  }
}

const approvalTx = () => historyTx('approve', erc20.encodeFunctionData('approve', [randomAddress(), 1n]))

const transferTx = () => historyTx('transfer', erc20.encodeFunctionData('transfer', [randomAddress(), 1n]))

const paginate = (url: URL, txs: HistoryTx[]) => {
  const cursor = new URLSearchParams(url.searchParams.get('cursor') ?? '')
  const limit = Number(cursor.get('limit'))
  const offset = Number(cursor.get('offset'))
  const next =
    offset + limit < txs.length
      ? `${url.origin}${url.pathname}?cursor=${encodeURIComponent(`limit=${limit}&offset=${offset + limit}`)}`
      : null
  const results = txs
    .slice(offset, offset + limit)
    .map((tx) => ({ type: 'TRANSACTION', transaction: tx.summary, conflictType: 'None' }))
  return HttpResponse.json({ next, previous: null, results })
}

const mockHistory = (
  safeAddress: string,
  history: { multisig: HistoryTx[]; module?: HistoryTx[] },
  failFirstPageWith?: number,
) => {
  const requests = { pageLimits: [] as number[], executedFilters: [] as (string | null)[], detailIds: [] as string[] }
  const all = [...history.multisig, ...(history.module ?? [])]
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/safes/${safeAddress}/multisig-transactions`, ({ request }) => {
      const url = new URL(request.url)
      requests.pageLimits.push(Number(new URLSearchParams(url.searchParams.get('cursor') ?? '').get('limit')))
      requests.executedFilters.push(url.searchParams.get('executed'))
      if (failFirstPageWith && requests.pageLimits.length === 1) {
        return new HttpResponse(null, { status: failFirstPageWith })
      }
      return paginate(url, history.multisig)
    }),
    http.get(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/safes/${safeAddress}/module-transactions`, ({ request }) =>
      paginate(new URL(request.url), history.module ?? []),
    ),
    http.get(`${GATEWAY_URL}/v1/chains/${CHAIN_ID}/transactions/:id`, ({ params }) => {
      requests.detailIds.push(params.id as string)
      return HttpResponse.json(all.find((tx) => tx.summary.id === params.id)!.details)
    }),
  )
  return requests
}

const APPROVAL_TOPIC = erc20.getEvent('Approval').topicHash

const approvalLog = (token: string, owner: string, spender: string) => ({
  address: token,
  topics: [APPROVAL_TOPIC, zeroPadValue(owner, 32), zeroPadValue(spender, 32)],
})

const scan = (
  safeAddress: string,
  batchSize = 10,
  signal = new AbortController().signal,
  getTransactionLogs: ScanOptions['getTransactionLogs'] = jest.fn(async () => []),
) => scanApprovalHistory({ chainId: CHAIN_ID, safeAddress, batchSize, signal, getTransactionLogs })

const pairs = (records: Awaited<ReturnType<typeof scan>>) =>
  records.map(({ token, spender }) => [token.value, spender.value]).sort()

describe('scanApprovalHistory', () => {
  beforeEach(() => {
    setStoreInstance(makeStore())
    clearScannedHistories()
  })

  it('pages through the history in batches of the configured size', async () => {
    const safeAddress = randomAddress()
    const requests = mockHistory(safeAddress, { multisig: Array.from({ length: 25 }, transferTx) })

    await scan(safeAddress, 10)

    expect(requests.pageLimits).toEqual([10, 10, 10])
  })

  it('asks only for executed multisig transactions, so a queued one never becomes the stop marker', async () => {
    const safeAddress = randomAddress()
    const requests = mockHistory(safeAddress, { multisig: Array.from({ length: 15 }, transferTx) })

    await scan(safeAddress, 10)

    expect(requests.executedFilters).toEqual(['true', 'true'])
  })

  it('retries a page the gateway answered with a server error', async () => {
    const safeAddress = randomAddress()
    const approval = approvalTx()
    const requests = mockHistory(safeAddress, { multisig: [approval] }, 503)

    const records = await scan(safeAddress)

    expect(requests.pageLimits).toHaveLength(2)
    expect(records).toHaveLength(1)
  })

  it('fails without retrying when the gateway answers with a client error', async () => {
    const safeAddress = randomAddress()
    const requests = mockHistory(safeAddress, { multisig: [approvalTx()] }, 404)

    await expect(scan(safeAddress)).rejects.toMatchObject({ status: 404 })
    expect(requests.pageLimits).toHaveLength(1)
  })

  it('returns the approvals made by multisig and module transactions', async () => {
    const safeAddress = randomAddress()
    const [multisigApproval, moduleApproval] = [approvalTx(), approvalTx()]
    mockHistory(safeAddress, { multisig: [transferTx(), multisigApproval], module: [moduleApproval] })

    const records = await scan(safeAddress)

    expect(pairs(records)).toEqual(
      [multisigApproval, moduleApproval]
        .map(({ details }) => [
          details.txData!.to.value,
          erc20.decodeFunctionData('approve', details.txData!.hexData!)[0],
        ])
        .sort(),
    )
  })

  it('finds an approval made through a delegatecall to another contract from the transaction events', async () => {
    const safeAddress = randomAddress()
    const [token, spender] = [randomAddress(), randomAddress()]
    const helperCall = historyTx(null, '0x12345678', randomAddress(), 1)
    mockHistory(safeAddress, { multisig: [helperCall] })
    const getTransactionLogs = jest.fn(async () => [approvalLog(token, safeAddress, spender)])

    const records = await scan(safeAddress, 10, undefined, getTransactionLogs)

    expect(getTransactionLogs).toHaveBeenCalledWith(helperCall.details.txHash)
    expect(pairs(records)).toEqual([[token, spender]])
  })

  it('reads the events of other contract calls instead of fetching their details', async () => {
    const safeAddress = randomAddress()
    const [token, spender] = [randomAddress(), randomAddress()]
    const contractCall = historyTx('execute', '0x12345678')
    contractCall.summary.txHash = faker.string.hexadecimal({ length: 64 })
    const requests = mockHistory(safeAddress, { multisig: [contractCall] })
    const getTransactionLogs = jest.fn(async () => [approvalLog(token, safeAddress, spender)])

    const records = await scan(safeAddress, 10, undefined, getTransactionLogs)

    expect(requests.detailIds).toEqual([])
    expect(getTransactionLogs).toHaveBeenCalledWith(contractCall.summary.txHash)
    expect(pairs(records)).toEqual([[token, spender]])
  })

  it('does not read the events of a plain approve call', async () => {
    const safeAddress = randomAddress()
    mockHistory(safeAddress, { multisig: [approvalTx()] })
    const getTransactionLogs = jest.fn(async () => [])

    await scan(safeAddress, 10, undefined, getTransactionLogs)

    expect(getTransactionLogs).not.toHaveBeenCalled()
  })

  it('fetches details only for transactions that may hold an approval', async () => {
    const safeAddress = randomAddress()
    const approval = approvalTx()
    const requests = mockHistory(safeAddress, { multisig: [transferTx(), approval, transferTx()] })

    await scan(safeAddress)

    expect(requests.detailIds).toEqual([approval.summary.id])
  })

  it('reads only the transactions executed since the last complete scan', async () => {
    const safeAddress = randomAddress()
    const [olderApproval, newerApproval] = [approvalTx(), approvalTx()]
    const history = { multisig: [olderApproval, ...Array.from({ length: 15 }, transferTx)] }
    mockHistory(safeAddress, history)
    await scan(safeAddress, 10)
    history.multisig.unshift(newerApproval)
    const requests = mockHistory(safeAddress, history)

    const records = await scan(safeAddress, 10)

    expect(requests.pageLimits).toEqual([10])
    expect(requests.detailIds).toEqual([newerApproval.summary.id])
    expect(records).toHaveLength(2)
  })

  it('rejects when aborted and rescans the whole history next time', async () => {
    const safeAddress = randomAddress()
    mockHistory(safeAddress, { multisig: Array.from({ length: 15 }, transferTx) })
    const controller = new AbortController()
    controller.abort()

    await expect(scan(safeAddress, 10, controller.signal)).rejects.toThrow()
    const requests = mockHistory(safeAddress, { multisig: Array.from({ length: 15 }, transferTx) })
    await scan(safeAddress, 10)

    expect(requests.pageLimits).toEqual([10, 10])
  })
})

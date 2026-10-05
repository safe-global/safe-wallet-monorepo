import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { faker } from '@faker-js/faker'
import { Interface } from 'ethers'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import {
  SAFENET_DEPLOYMENT,
  SAFENET_DEPLOYMENT_BLOCK,
  SAFENET_RPC_URLS,
  type Hex,
} from '@safe-global/utils/features/safenet-checks'
import { CONSENSUS_READ_ABI, oracleReadInterface } from '@safe-global/utils/features/safenet-checks/abi'
import { EMPTY_ORACLE_DATA_HASH, buildOracleProposedLog } from '@safe-global/utils/features/safenet-checks/builders'
import type { RawLog } from '@safe-global/utils/features/safenet-checks/utils/decodeLogs'
import { transactionProposalHash } from '@safe-global/utils/features/safenet-checks/utils/proposalHash'
import { StoreDecorator } from '@/stories/storeDecorator'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafenetChecksSection } from './SafenetChecksSection'

faker.seed(456)

const SAFE = '0x0000000000000000000000000000000000000123'
const SAFE_CHAIN_ID = '1'
const SAFE_TX_HASH = `0x${'cd'.repeat(32)}` as Hex
const SUBMITTED_AT = 1_770_000_000_000
// Close enough to the deployment block that the read window reaches it: only then may "not checked" be claimed.
const HEAD_BLOCK = SAFENET_DEPLOYMENT_BLOCK + 1_000
const BLOCK_TIME_SECONDS = 5
// Ten minutes of blocks after the proposal, so the derived read window is real.
const HEAD_TIMESTAMP = Math.floor(SUBMITTED_AT / 1000) + 600
const EPOCH = 32_939n
const ORACLE = SAFENET_DEPLOYMENT.oracles[0]
const PROPOSAL_BLOCK = HEAD_BLOCK - 20

const REQUEST_ID = transactionProposalHash({
  chainId: SAFENET_DEPLOYMENT.chainId,
  consensus: SAFENET_DEPLOYMENT.consensus,
  epoch: EPOCH.toString(),
  oracle: ORACLE,
  oracleDataHash: EMPTY_ORACLE_DATA_HASH as Hex,
  safeTxHash: SAFE_TX_HASH,
})

const PROPOSAL_LOG = buildOracleProposedLog(
  { safeTxHash: SAFE_TX_HASH, chainId: BigInt(SAFE_CHAIN_ID), safe: SAFE, epoch: EPOCH, oracle: ORACLE },
  { blockNumber: PROPOSAL_BLOCK },
)

const toHex = (value: number): string => `0x${value.toString(16)}`

type RpcRequest = { id: number; method: string; params: unknown[] }
type LogFilter = { address?: string; topics: Array<string | string[] | null>; fromBlock: string; toBlock: string }
type EthCall = { to: string; data: string }
type CallAnswer = { result: string } | { error: { code: number; message: string; data?: string } }

const consensusRead = new Interface(CONSENSUS_READ_ABI)
const GET_COORDINATOR = consensusRead.getFunction('getCoordinator')?.selector
const GET_PROPOSER = oracleReadInterface.getFunction('PROPOSER')?.selector
const GET_REQUEST = oracleReadInterface.getFunction('getRequest')?.selector

const NULL_ADDRESS = `0x${'00'.repeat(20)}`
const REQUEST_NOT_FOUND = oracleReadInterface.encodeErrorResult('RequestNotFound')
// PENDING with no votes; both deadlines lie after the head.
const PENDING_REQUEST = oracleReadInterface.encodeFunctionResult('getRequest', [
  [
    [HEAD_BLOCK + 100, 0, HEAD_BLOCK + 500, 0n, 0, NULL_ADDRESS, 0n],
    [1, 0n, 0, 0, 0, 0, 0, 0],
  ],
])

const blockAt = (number: number) => ({
  number: toHex(number),
  timestamp: toHex(HEAD_TIMESTAMP - (HEAD_BLOCK - number) * BLOCK_TIME_SECONDS),
  hash: `0x${'22'.repeat(32)}`,
  parentHash: `0x${'33'.repeat(32)}`,
  nonce: '0x0000000000000000',
  difficulty: '0x0',
  gasLimit: '0x1c9c380',
  gasUsed: '0x0',
  miner: `0x${'00'.repeat(20)}`,
  extraData: '0x',
  baseFeePerGas: '0x7',
  transactions: [],
})

const matchesTopic = (wanted: string | string[] | null | undefined, actual: string | undefined): boolean =>
  wanted == null || [wanted].flat().some((topic) => topic.toLowerCase() === actual?.toLowerCase())

const matchesFilter = (log: RawLog, filter: LogFilter): boolean =>
  (!filter.address || log.address?.toLowerCase() === filter.address.toLowerCase()) &&
  filter.topics.every((wanted, index) => matchesTopic(wanted, log.topics[index])) &&
  log.blockNumber >= Number(BigInt(filter.fromBlock)) &&
  log.blockNumber <= Number(BigInt(filter.toBlock))

const toRpcLog = (log: RawLog) => ({
  address: log.address,
  topics: log.topics,
  data: log.data,
  blockNumber: toHex(log.blockNumber),
  transactionHash: log.transactionHash,
  transactionIndex: '0x0',
  blockHash: `0x${'11'.repeat(32)}`,
  logIndex: toHex(log.logIndex),
  removed: false,
})

const answerCall = (data: string): CallAnswer => {
  const selector = data.slice(0, 10)
  if (selector === GET_COORDINATOR) {
    return { result: consensusRead.encodeFunctionResult('getCoordinator', [SAFENET_DEPLOYMENT.coordinator]) }
  }
  if (selector === GET_PROPOSER) {
    return { result: oracleReadInterface.encodeFunctionResult('PROPOSER', [SAFENET_DEPLOYMENT.consensus]) }
  }
  if (selector === GET_REQUEST) {
    if (`0x${data.slice(10, 74)}` === REQUEST_ID) return { result: PENDING_REQUEST }
    return { error: { code: 3, message: 'execution reverted', data: REQUEST_NOT_FOUND } }
  }
  return { error: { code: 3, message: 'unhandled eth_call' } }
}

const rpcHolding = (logs: RawLog[]) =>
  http.post(SAFENET_RPC_URLS[0], async ({ request }) => {
    const answer = (req: RpcRequest) => {
      const ok = (result: unknown) => ({ jsonrpc: '2.0', id: req.id, result })
      switch (req.method) {
        case 'eth_chainId':
          return ok('0x64')
        case 'eth_getBlockByNumber': {
          const tag = req.params[0] as string
          return ok(blockAt(tag === 'latest' ? HEAD_BLOCK : Number(BigInt(tag))))
        }
        case 'eth_getLogs': {
          const filter = req.params[0] as LogFilter
          return ok(logs.filter((log) => matchesFilter(log, filter)).map(toRpcLog))
        }
        case 'eth_call': {
          const call = req.params[0] as EthCall
          return { jsonrpc: '2.0', id: req.id, ...answerCall(call.data) }
        }
        default:
          return { jsonrpc: '2.0', id: req.id, error: { code: 3, message: `unhandled ${req.method}` } }
      }
    }

    const body = (await request.json()) as RpcRequest | RpcRequest[]
    return HttpResponse.json(Array.isArray(body) ? body.map(answer) : answer(body))
  })

const unreachableRpc = http.post(SAFENET_RPC_URLS[0], () => new HttpResponse(null, { status: 503 }))

const txDetails = {
  detailedExecutionInfo: { type: DetailedExecutionInfoType.MULTISIG, submittedAt: SUBMITTED_AT },
} as unknown as TransactionDetails

const flow = { txId: `multisig_${SAFE}_${SAFE_TX_HASH}`, txDetails } as TxFlowContextType

const safeInfo = { data: { address: { value: SAFE }, chainId: SAFE_CHAIN_ID }, loaded: true, loading: false }

const meta: Meta<typeof SafenetChecksSection> = {
  title: 'Features/SafenetChecks/SafenetChecksSection',
  component: SafenetChecksSection,
  // The copy appears only after a chain read and a fade-in, so a pixel baseline
  // would race the poll loop.
  parameters: { layout: 'centered', visualTest: { disable: true } },
  loaders: [mswLoader],
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{ safeInfo }} context={context}>
        <TxFlowContext.Provider value={flow}>
          <div className="bg-background w-80 rounded-lg">
            <Story />
          </div>
        </TxFlowContext.Provider>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const NoCheckRequested: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: { handlers: [rpcHolding([])] },
    docs: { description: { story: 'Normal on beta today: nothing requested a check for this transaction.' } },
  },
}

export const ReadFailed: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: { handlers: [unreachableRpc] },
    docs: { description: { story: 'A problem: the chain read failed, so no state can be reported.' } },
  },
}

export const Submitted: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: { handlers: [rpcHolding([PROPOSAL_LOG])] },
    docs: { description: { story: 'A check was proposed onchain and is inside its deadline.' } },
  },
}

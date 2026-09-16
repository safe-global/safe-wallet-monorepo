import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { SAFENET_RPC_URLS } from '@safe-global/utils/features/safenet-checks'
import { buildPlainProposedLog } from '@safe-global/utils/features/safenet-checks/builders'
import type { RawLog } from '@safe-global/utils/features/safenet-checks/utils/decodeLogs'
import { StoreDecorator } from '@/stories/storeDecorator'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafenetChecksSection } from './SafenetChecksSection'

faker.seed(456)

const SAFE = '0x0000000000000000000000000000000000000123'
const SAFE_TX_HASH = `0x${'cd'.repeat(32)}`
const SUBMITTED_AT = 1_770_000_000_000
const HEAD_BLOCK = 40_000_000
const BLOCK_TIME_SECONDS = 5
// Ten minutes of blocks after the proposal, so the derived read window is real.
const HEAD_TIMESTAMP = Math.floor(SUBMITTED_AT / 1000) + 600

const toHex = (value: number): string => `0x${value.toString(16)}`

type RpcRequest = { id: number; method: string; params: unknown[] }

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
        case 'eth_getLogs':
          return ok(
            logs.map((log) => ({
              address: log.address,
              topics: log.topics,
              data: log.data,
              blockNumber: toHex(log.blockNumber),
              transactionHash: log.transactionHash,
              transactionIndex: '0x0',
              blockHash: `0x${'11'.repeat(32)}`,
              logIndex: toHex(log.logIndex),
              removed: false,
            })),
          )
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

const meta: Meta<typeof SafenetChecksSection> = {
  title: 'Features/SafenetChecks/SafenetChecksSection',
  component: SafenetChecksSection,
  // The copy appears only after a chain read and a fade-in, so a pixel baseline
  // would race the poll loop.
  parameters: { layout: 'centered', visualTest: { disable: true } },
  loaders: [mswLoader],
  decorators: [
    (Story, context) => (
      <StoreDecorator initialState={{}} context={context}>
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
    msw: {
      handlers: [
        rpcHolding([
          buildPlainProposedLog({ safeTxHash: SAFE_TX_HASH, epoch: 32_939n }, { blockNumber: HEAD_BLOCK - 20 }),
        ]),
      ],
    },
    docs: { description: { story: 'A check was proposed onchain and is inside its deadline.' } },
  },
}

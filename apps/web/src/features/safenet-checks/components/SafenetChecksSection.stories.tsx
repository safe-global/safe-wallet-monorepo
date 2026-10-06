import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { createMockChain } from '@safe-global/test'
import { SAFENET_ORACLE_ADDRESSES } from '@safe-global/utils/features/safenet-checks'
import { buildCheckView, buildOracleProposedLog } from '@safe-global/utils/features/safenet-checks/builders'
import { CheckStatus, type UnavailableReason } from '@safe-global/utils/features/safenet-checks'
import type { RawLog } from '@safe-global/utils/features/safenet-checks/utils/decodeLogs'
import { StoreDecorator } from '@/stories/storeDecorator'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafenetChecksSection, SafenetChecksSectionView, type PreCheckKind } from './SafenetChecksSection'
import {
  SAFENET_EXAMPLE_VOTES,
  STORY_CHAIN_ID,
  STORY_SAFE_TX_HASH,
  STORY_SUBMITTED_AT,
  exampleSnapshot,
  inProgressElapsed,
  inProgressWithDeadline,
  rejectedSnapshot,
} from './storyExamples'

faker.seed(456)

const SAFE = '0x0000000000000000000000000000000000000123'
const SAFE_TX_HASH = `0x${'cd'.repeat(32)}`
const SUBMITTED_AT = 1_770_000_000_000
const HEAD_BLOCK = 40_000_000
const BLOCK_TIME_SECONDS = 5
// Ten minutes of blocks after the proposal, so the derived read window is real.
const HEAD_TIMESTAMP = Math.floor(SUBMITTED_AT / 1000) + 600

const RPC_URL = 'https://rpc.safe.global/100/'
const chainConfig = http.get('*/v2/chains', () =>
  HttpResponse.json({
    results: [createMockChain({ chainId: '100', rpcUri: RPC_URL })],
    next: null,
    previous: null,
    count: 1,
  }),
)

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
  http.post(RPC_URL, async ({ request }) => {
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

const unreachableRpc = http.post(RPC_URL, () => new HttpResponse(null, { status: 503 }))

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
    msw: { handlers: [chainConfig, rpcHolding([])] },
    docs: { description: { story: 'Normal on beta today: nothing requested a check for this transaction.' } },
  },
}

export const ReadFailed: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: { handlers: [chainConfig, unreachableRpc] },
    docs: { description: { story: 'A problem: the chain read failed, so no state can be reported.' } },
  },
}

export const Submitted: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: [
        chainConfig,
        rpcHolding([
          buildOracleProposedLog(
            { safeTxHash: SAFE_TX_HASH, epoch: 32_939n, oracle: SAFENET_ORACLE_ADDRESSES[0] },
            { blockNumber: HEAD_BLOCK - 20 },
          ),
        ]),
      ],
    },
    docs: { description: { story: 'A check was proposed onchain and is inside its deadline.' } },
  },
}

type ViewCheck = Parameters<typeof SafenetChecksSectionView>[0]['check']

const viewStory = (check: ViewCheck, story: string, preCheck?: PreCheckKind): Story => ({
  render: () => (
    <SafenetChecksSectionView
      check={check}
      safeTxHash={STORY_SAFE_TX_HASH}
      chainId={STORY_CHAIN_ID}
      submittedAt={STORY_SUBMITTED_AT}
      preCheck={preCheck}
    />
  ),
  parameters: { docs: { description: { story } } },
})

const verdict = (snapshot: ReturnType<typeof exampleSnapshot>, over: Partial<ViewCheck> = {}): ViewCheck =>
  buildCheckView({
    snapshot,
    status: snapshot.status,
    publicStatus: snapshot.status as ViewCheck['publicStatus'],
    ...over,
  })

const unavailable = (reason: UnavailableReason): ViewCheck =>
  buildCheckView({
    snapshot:
      reason === 'READ_FAILED'
        ? undefined
        : exampleSnapshot(CheckStatus.SUBMITTED, { status: CheckStatus.UNAVAILABLE }),
    unavailableReason: reason,
  })

export const PreCheckFirstSigner = viewStory(
  buildCheckView(),
  'First signer of a new multisig transaction. No check exists until they sign.',
  'multisig',
)
export const PreCheckSingleSignerSignOnly = viewStory(
  buildCheckView(),
  '1/1 Safe that chose "No, later": signs now, executes from the queue once the result is in.',
  'single',
)
export const PreCheckExecuteNow = viewStory(
  buildCheckView(),
  '1/1 Safe (or a last signer) executing in the same click: explains how to see the result first.',
  'executeNow',
)

export const Loading = viewStory(
  buildCheckView({ isLoading: true }),
  'Renders nothing on purpose while the first read is in flight, so a finished check never shows a waiting state.',
)

export const StateNoCheck = viewStory(
  unavailable('NO_CHECK'),
  'UNAVAILABLE · NO_CHECK: the read proves no check was requested.',
)
export const StateReadFailed = viewStory(
  unavailable('READ_FAILED'),
  'UNAVAILABLE · READ_FAILED: a technical fault reading the chain.',
)
export const StateWindowUncertain = viewStory(
  unavailable('WINDOW_UNCERTAIN'),
  'UNAVAILABLE · WINDOW_UNCERTAIN: nothing found where the read looked; not proof of absence.',
)
export const StateSubmitted = viewStory(verdict(exampleSnapshot(CheckStatus.SUBMITTED)), 'SUBMITTED.')
export const StateInProgress = viewStory(
  verdict(inProgressWithDeadline()),
  'IN_PROGRESS with the reveal deadline known: time left is an upper bound.',
)
export const StateInProgressElapsed = viewStory(
  verdict(inProgressElapsed()),
  'IN_PROGRESS without block data: elapsed time fallback.',
)
export const StateInProgressStale = viewStory(
  verdict(inProgressWithDeadline(), { isStale: true }),
  'IN_PROGRESS while the latest refetch failed and the last good snapshot is shown.',
)
export const StateBenign = viewStory(
  verdict(exampleSnapshot(CheckStatus.BENIGN)),
  'BENIGN, verified: links the attestation.',
)
export const StateTimedOut = viewStory(
  verdict(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.openDispute, CheckStatus.TIMED_OUT)),
  'TIMED_OUT. Example #8: one sentinel approved, one cited R-4.3, and the dispute has no ruling yet.',
)

export const MaliciousSettingsChange = viewStory(
  verdict(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.settingsChange)),
  'Example #1 (swapOwner): one rule, R-4.1 — the copy says a settings change is expected to be flagged.',
)
export const MaliciousDelegateCallAndSettings = viewStory(
  verdict(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.delegateCallAndSettings)),
  'Example #2 (multiSend of swapOwner): several rules, most-cited first.',
)
export const MaliciousDelegateCall = viewStory(
  verdict(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.delegateCall)),
  'Example #3: one rule, R-4.2.',
)
export const MaliciousApprovalAndSpender = viewStory(
  verdict(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.approvalAndSpender)),
  'Example #4 (DAI approve): R-4.5 ×3 and R-4.4 — sentinels disagree on the rule.',
)
export const MaliciousExcessiveApproval = viewStory(
  verdict(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.excessiveApproval)),
  'Example #5: one rule, R-4.5.',
)
export const MaliciousBlocklisted = viewStory(
  verdict(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.blocklisted)),
  'Example #6 (BAND transfer): one rule, R-4.6, one sentinel.',
)
export const MaliciousCouncilDenial = viewStory(
  verdict(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.councilDenial)),
  'Example #7: split vote (1 of 2, R-4.1), denied by the council.',
)
export const MaliciousUnrecognisedReason = viewStory(
  verdict(rejectedSnapshot(SAFENET_EXAMPLE_VOTES.unrecognised)),
  'Illustrative unknown code: falls back to the generic copy, still shows the count.',
)

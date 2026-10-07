import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { userEvent, within } from 'storybook/test'
import {
  createMockPendingTransactions,
  createMockStory,
  createMockTransactionDetails,
  getFixtureData,
} from '@/stories/mocks'
import Queue from '@/pages/transactions/queue'
import { safenetChainsHandler, safenetCheck, safenetRpcHandler } from './safenetChainMocks'

const { safeData } = getFixtureData('efSafe')
const SAFE = safeData.address.value

const hashOf = (tag: string) => `0x${tag.repeat(16)}`
const txIdOf = (tag: string) => `multisig_${SAFE}_${hashOf(tag)}`

/** The default queue, re-keyed so every row id ends in a real safeTxHash, plus a fourth transfer. */
const queue = (() => {
  const base = createMockPendingTransactions(safeData)
  const [label, settings, usdc, eth] = base.results
  const rekey = <T extends typeof settings>(item: T, tag: string, nonceOffset = 0) =>
    item.type === 'TRANSACTION'
      ? {
          ...item,
          transaction: {
            ...item.transaction,
            id: txIdOf(tag),
            executionInfo: {
              ...item.transaction.executionInfo,
              nonce: item.transaction.executionInfo.nonce + nonceOffset,
            },
          },
        }
      : item
  return {
    ...base,
    count: 4,
    results: [label, rekey(settings, 'abc3'), rekey(usdc, 'abc1'), rekey(eth, 'abc2'), rekey(eth, 'abc4', 1)],
  }
})()

const timestampOf = (tag: string): number => {
  const row = queue.results.find((item) => item.type === 'TRANSACTION' && item.transaction.id === txIdOf(tag))
  return row && row.type === 'TRANSACTION' ? row.transaction.timestamp : Date.now()
}

const spec = (tag: string) => ({ safeTxHash: hashOf(tag), safe: SAFE, chainId: '1', timestampMs: timestampOf(tag) })

const queueHandler = http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/queued/, () =>
  HttpResponse.json(queue),
)

/** Row details keep the hash the row id carries, so the audit log reads the same check. */
const txDetailsHandler = http.get(/\/v1\/chains\/\d+\/transactions\/[^/]+$/, ({ request }) => {
  const txId = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '')
  const details = createMockTransactionDetails(safeData, txId)
  const safeTxHash = txId.slice(-66)
  return HttpResponse.json({
    ...details,
    detailedExecutionInfo: { ...details.detailedExecutionInfo, safeTxHash },
  })
})

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/queue',
  features: { safenetChecks: true },
  store: { txQueue: { data: queue, loading: false, loaded: true } },
})

const handlers = (logs: ReturnType<typeof safenetCheck.submitted>) => [
  safenetChainsHandler(),
  queueHandler,
  txDetailsHandler,
  safenetRpcHandler(logs),
  ...setup.parameters.msw.handlers,
]

/** One row per Safenet state: risk detected, simulating, no issues found, check failed. */
const allStates = [
  ...safenetCheck.malicious(spec('abc3'), ['R-4.1', 'R-4.1']),
  ...safenetCheck.inProgress(spec('abc1')),
  ...safenetCheck.benign(spec('abc2')),
  ...safenetCheck.timedOut(spec('abc4'), [null, 'R-4.3']),
]

const meta = {
  title: 'Pages/Safenet/Queue',
  component: Queue,
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    msw: { handlers: handlers(allStates) },
    // Chain reads resolve after mount and the chips fade in.
    visualTest: { disable: true },
  },
  decorators: [setup.decorator],
} satisfies Meta<typeof Queue>

export default meta
type Story = StoryObj<typeof meta>

export const AllStates: Story = {}

const expandRow = async (canvasElement: HTMLElement, index: number) => {
  const rows = await within(canvasElement).findAllByTestId('transaction-item', {}, { timeout: 10_000 })
  await userEvent.click(rows[index])
}

/** The settings change, flagged by both sentinels (example #1), expanded to show the audit log. */
export const RiskDetectedExpanded: Story = {
  play: ({ canvasElement }) => expandRow(canvasElement, 0),
}

export const SimulatingExpanded: Story = {
  play: ({ canvasElement }) => expandRow(canvasElement, 1),
}

export const NoIssuesFoundExpanded: Story = {
  play: ({ canvasElement }) => expandRow(canvasElement, 2),
}

export const CheckFailedExpanded: Story = {
  play: ({ canvasElement }) => expandRow(canvasElement, 3),
}

/** Proposed onchain, no sentinel activity yet. */
export const Submitted: Story = {
  parameters: { msw: { handlers: handlers(safenetCheck.submitted(spec('abc1'))) } },
  play: ({ canvasElement }) => expandRow(canvasElement, 1),
}

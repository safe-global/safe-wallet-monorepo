import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { createMockStory, createMockTransactionDetails, getFixtureData } from '@/stories/mocks'
import TxDetail from '@/pages/transactions/tx'
import { safenetChainsHandler, safenetCheck, safenetRpcHandler, type Vote } from './safenetChainMocks'

const { safeData } = getFixtureData('efSafe')
const SAFE = safeData.address.value
const SAFE_TX_HASH = `0x${'abc1'.repeat(16)}`
const TX_ID = `multisig_${SAFE}_${SAFE_TX_HASH}`
const SUBMITTED_AT = Date.now() - 5 * 60_000

/** The USDC transfer from the default mocks, keyed by a real safeTxHash. */
const txDetailsHandler = http.get(/\/v1\/chains\/\d+\/transactions\/[^/]+$/, () => {
  const details = createMockTransactionDetails(safeData, TX_ID)
  return HttpResponse.json({
    ...details,
    detailedExecutionInfo: { ...details.detailedExecutionInfo, safeTxHash: SAFE_TX_HASH, submittedAt: SUBMITTED_AT },
  })
})

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/transactions/tx',
  query: { id: TX_ID },
  features: { safenetChecks: true },
})

const spec = { safeTxHash: SAFE_TX_HASH, safe: SAFE, chainId: '1', timestampMs: SUBMITTED_AT }

const story = (logs: ReturnType<typeof safenetCheck.submitted>): Story => ({
  parameters: {
    msw: {
      handlers: [safenetChainsHandler(), txDetailsHandler, safenetRpcHandler(logs), ...setup.parameters.msw.handlers],
    },
  },
})

const meta = {
  title: 'Pages/Safenet/Transaction details',
  component: TxDetail,
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    // Chain reads resolve after mount and the Safenet row fades in.
    visualTest: { disable: true },
  },
  decorators: [setup.decorator],
} satisfies Meta<typeof TxDetail>

export default meta
type Story = StoryObj<typeof meta>

const malicious = (votes: Vote[]) => story(safenetCheck.malicious(spec, votes))

export const Submitted = story(safenetCheck.submitted(spec))
export const Simulating = story(safenetCheck.inProgress(spec))
export const NoIssuesFound = story(safenetCheck.benign(spec))
/** Example #6: one sentinel cited a blocklisted address. */
export const RiskDetected = malicious(['R-4.6'])
/** Example #4: sentinels disagree on the rule. */
export const RiskDetectedSeveralRules = malicious(['R-4.5', 'R-4.5', 'R-4.4', 'R-4.5'])
/** Example #8: a split vote with no ruling before the deadline. */
export const CheckFailed = story(safenetCheck.timedOut(spec, [null, 'R-4.3']))
export const NoCheck: Story = story([])

// Preview deploy marker (no runtime effect).

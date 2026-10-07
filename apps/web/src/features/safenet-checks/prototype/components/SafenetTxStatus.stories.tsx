import type { Meta, StoryObj } from '@storybook/react'
import { SAFENET_EXPLORER_URL } from '@safe-global/utils/features/safenet-checks/constants'
import { MOCK_DATA_NOTE, STORY_NOW_MS, STORY_STATES } from '../__fixtures__/checkStates'
import { SafenetTxStatusView } from './SafenetTxStatus'

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetTxStatus',
  component: SafenetTxStatusView,
  parameters: {
    docs: { description: { component: `Safenet result in an expanded queued transaction. ${MOCK_DATA_NOTE}` } },
  },
  args: { nowMs: STORY_NOW_MS, explorerHref: SAFENET_EXPLORER_URL },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafenetTxStatusView>

export default meta
type Story = StoryObj<typeof meta>

export const Checking: Story = { args: { state: STORY_STATES.checking } }
export const NoIssuesFound: Story = { args: { state: STORY_STATES['no-issues'] } }
export const RiskDetected: Story = { args: { state: STORY_STATES.risk } }
export const Unavailable: Story = { args: { state: STORY_STATES.unavailable } }

import type { Meta, StoryObj } from '@storybook/react'
import { MOCK_DATA_NOTE, STORY_NOW_MS, STORY_STATES } from '../__fixtures__/checkStates'
import { SafenetExecuteStatusView } from './SafenetExecuteStatus'

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetExecuteStatus',
  component: SafenetExecuteStatusView,
  parameters: {
    docs: {
      description: {
        component: `Safenet status at the execute step. "Wait for result" never disables Execute. ${MOCK_DATA_NOTE}`,
      },
    },
  },
  args: { nowMs: STORY_NOW_MS, onWait: () => {} },
  decorators: [
    (Story) => (
      <div className="w-[560px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafenetExecuteStatusView>

export default meta
type Story = StoryObj<typeof meta>

export const Submitted: Story = { args: { state: STORY_STATES.submitted } }
export const Checking: Story = { args: { state: STORY_STATES.checking } }
export const CheckingWaiting: Story = { args: { state: STORY_STATES.checking, isWaiting: true } }
export const CheckingOverdue: Story = { args: { state: STORY_STATES.checking, nowMs: STORY_NOW_MS + 60_000 } }
export const NoIssuesFound: Story = { args: { state: STORY_STATES['no-issues'] } }
export const RiskDetected: Story = { args: { state: STORY_STATES.risk } }
export const Unavailable: Story = { args: { state: STORY_STATES.unavailable } }

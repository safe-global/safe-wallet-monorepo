import type { Meta, StoryObj } from '@storybook/react'
import { MOCK_DATA_NOTE, STORY_STATES } from '../__fixtures__/checkStates'
import { SafenetQueueChipView } from './SafenetQueueChip'

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetQueueChip',
  component: SafenetQueueChipView,
  parameters: {
    docs: { description: { component: `Per-transaction Safenet state in the queue. ${MOCK_DATA_NOTE}` } },
  },
} satisfies Meta<typeof SafenetQueueChipView>

export default meta
type Story = StoryObj<typeof meta>

export const Checking: Story = { args: { state: STORY_STATES.checking } }
export const NoIssuesFound: Story = { args: { state: STORY_STATES['no-issues'] } }
export const RiskDetected: Story = { args: { state: STORY_STATES.risk } }
export const Unavailable: Story = { args: { state: STORY_STATES.unavailable } }

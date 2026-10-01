import type { Meta, StoryObj } from '@storybook/react'
import { MOCK_DATA_NOTE, STORY_NOW_MS, STORY_STATES } from '../__fixtures__/checkStates'
import { SafenetStepperNoteView } from './SafenetStepperNote'

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetStepperNote',
  component: SafenetStepperNoteView,
  parameters: {
    docs: {
      description: { component: `Safenet status under the signing step of the tx flow rail. ${MOCK_DATA_NOTE}` },
    },
  },
  args: { nowMs: STORY_NOW_MS },
  decorators: [
    (Story) => (
      <div className="flex w-44 flex-col text-xs">
        <span>Confirmed (0 of 2)</span>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafenetStepperNoteView>

export default meta
type Story = StoryObj<typeof meta>

export const BeforeSigning: Story = { args: { state: STORY_STATES['before-sign'] } }
export const Submitted: Story = { args: { state: STORY_STATES.submitted } }
export const Checking: Story = { args: { state: STORY_STATES.checking } }
export const NoIssuesFound: Story = { args: { state: STORY_STATES['no-issues'] } }
export const RiskDetected: Story = { args: { state: STORY_STATES.risk } }
export const Unavailable: Story = { args: { state: STORY_STATES.unavailable } }
export const Locked: Story = { args: { state: STORY_STATES.locked } }

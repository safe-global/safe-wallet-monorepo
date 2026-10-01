import type { Meta, StoryObj } from '@storybook/react'
import { MOCK_DATA_NOTE, STORY_STATES } from '../__fixtures__/checkStates'
import { SafenetCardCaptionView } from './SafenetCardCaption'

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetCardCaption',
  component: SafenetCardCaptionView,
  parameters: {
    docs: { description: { component: `Safenet caption under a tx card's buttons. ${MOCK_DATA_NOTE}` } },
  },
  args: { onWait: () => {} },
  decorators: [
    (Story) => (
      <div className="w-[560px] overflow-hidden rounded-xl bg-card p-6">
        <div className="flex justify-end">
          <span className="rounded-md bg-foreground px-6 py-2 text-sm text-background">Execute</span>
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafenetCardCaptionView>

export default meta
type Story = StoryObj<typeof meta>

export const ReviewBeforeSigning: Story = { args: { state: STORY_STATES['before-sign'], step: 'review' } }
export const ReviewChecking: Story = { args: { state: STORY_STATES.checking, step: 'review' } }
export const SignChecking: Story = { args: { state: STORY_STATES.checking, step: 'sign' } }
export const ExecuteChecking: Story = { args: { state: STORY_STATES.checking, step: 'execute' } }
export const ExecuteWaiting: Story = { args: { state: STORY_STATES.checking, step: 'execute', isWaiting: true } }
export const ExecuteNoIssues: Story = { args: { state: STORY_STATES['no-issues'], step: 'execute' } }
export const ExecuteRisk: Story = { args: { state: STORY_STATES.risk, step: 'execute' } }
export const ExecuteUnavailable: Story = { args: { state: STORY_STATES.unavailable, step: 'execute' } }

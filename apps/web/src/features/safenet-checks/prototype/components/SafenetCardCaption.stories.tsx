import type { Meta, StoryObj } from '@storybook/react'
import { MOCK_DATA_NOTE, STORY_NOW_MS, STORY_STATES } from '../__fixtures__/checkStates'
import { SafenetCardCaptionView } from './SafenetCardCaption'

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetCardCaption',
  component: SafenetCardCaptionView,
  parameters: {
    docs: { description: { component: `Safenet note above the Sign or Execute button. ${MOCK_DATA_NOTE}` } },
  },
  args: { nowMs: STORY_NOW_MS },
  decorators: [
    (Story) => (
      <div className="w-[560px] rounded-xl bg-card p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafenetCardCaptionView>

export default meta
type Story = StoryObj<typeof meta>

export const FirstSignerBeforeSigning: Story = { args: { state: STORY_STATES['before-sign'], role: 'first-signer' } }
export const LastSignerBeforeSigning: Story = { args: { state: STORY_STATES['before-sign'], role: 'final-signer' } }
export const CoSignerChecking: Story = { args: { state: STORY_STATES.checking, role: 'co-signer' } }
export const LastSignerChecking: Story = { args: { state: STORY_STATES.checking, role: 'final-signer' } }
export const ExecutorChecking: Story = { args: { state: STORY_STATES.checking, role: 'executor' } }
export const ExecutorNoIssues: Story = { args: { state: STORY_STATES['no-issues'], role: 'executor' } }
export const ExecutorRisk: Story = { args: { state: STORY_STATES.risk, role: 'executor' } }
export const ExecutorUnavailable: Story = { args: { state: STORY_STATES.unavailable, role: 'executor' } }

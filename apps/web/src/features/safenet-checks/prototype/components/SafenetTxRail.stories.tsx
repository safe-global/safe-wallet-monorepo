import type { Meta, StoryObj } from '@storybook/react'
import { MOCK_DATA_NOTE, STORY_NOW_MS, STORY_STATES } from '../__fixtures__/checkStates'
import { SafenetTxRailView } from './SafenetTxRail'

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetTxRail',
  component: SafenetTxRailView,
  parameters: {
    docs: {
      description: {
        component: `The tx flow's left rail with Safenet under the Sign step. Labels show from 1200px. ${MOCK_DATA_NOTE}`,
      },
    },
  },
} satisfies Meta<typeof SafenetTxRailView>

export default meta
type Story = StoryObj<typeof meta>

export const ConfirmBeforeSigning: Story = {
  args: { current: 'confirm', safenet: { state: STORY_STATES['before-sign'], nowMs: STORY_NOW_MS } },
}
export const SignChecking: Story = {
  args: {
    current: 'sign',
    safenet: { state: STORY_STATES.checking, nowMs: STORY_NOW_MS },
    signatures: { submitted: 1, required: 2 },
  },
}
export const ExecuteNoIssues: Story = {
  args: { current: 'execute', safenet: { state: STORY_STATES['no-issues'], nowMs: STORY_NOW_MS } },
}
export const ExecuteRisk: Story = {
  args: { current: 'execute', safenet: { state: STORY_STATES.risk, nowMs: STORY_NOW_MS } },
}

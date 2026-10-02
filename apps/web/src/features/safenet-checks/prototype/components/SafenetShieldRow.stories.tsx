import type { Meta, StoryObj } from '@storybook/react'
import { SAFENET_EXPLORER_URL } from '@safe-global/utils/features/safenet-checks/constants'
import { MOCK_DATA_NOTE, STORY_NOW_MS, STORY_STATES } from '../__fixtures__/checkStates'
import { SafenetShieldRowView } from './SafenetShieldRow'

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetShieldRow',
  component: SafenetShieldRowView,
  parameters: { docs: { description: { component: `Safenet section in the Safe Shield panel. ${MOCK_DATA_NOTE}` } } },
  args: { explorerHref: SAFENET_EXPLORER_URL, nowMs: STORY_NOW_MS, onEnable: () => {} },
  decorators: [
    (Story) => (
      <div className="w-80 overflow-hidden rounded-lg bg-card">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SafenetShieldRowView>

export default meta
type Story = StoryObj<typeof meta>

export const BeforeSigning: Story = { args: { state: STORY_STATES['before-sign'] } }
export const Submitted: Story = { args: { state: STORY_STATES.submitted } }
export const Checking: Story = { args: { state: STORY_STATES.checking } }
export const NoIssuesFound: Story = { args: { state: STORY_STATES['no-issues'] } }
export const RiskDetected: Story = { args: { state: STORY_STATES.risk } }
export const Unavailable: Story = { args: { state: STORY_STATES.unavailable } }
export const Locked: Story = { args: { state: STORY_STATES.locked } }

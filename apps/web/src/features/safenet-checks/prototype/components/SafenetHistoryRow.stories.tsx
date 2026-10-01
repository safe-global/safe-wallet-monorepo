import type { Meta, StoryObj } from '@storybook/react'
import { AuditLog, AuditRow } from '@/components/common/AuditLog'
import { SAFENET_EXPLORER_URL } from '@safe-global/utils/features/safenet-checks/constants'
import { MOCK_DATA_NOTE, STORY_STARTED_AT_MS, STORY_STATES } from '../__fixtures__/checkStates'
import { SafenetHistoryRowView } from './SafenetHistoryRow'

const meta = {
  title: 'Features/SafenetChecks/Prototype/SafenetHistoryRow',
  component: SafenetHistoryRowView,
  parameters: {
    docs: { description: { component: `Safenet step in the transaction audit log. ${MOCK_DATA_NOTE}` } },
  },
  args: { explorerHref: `${SAFENET_EXPLORER_URL}/#/safeTx?chainId=1&safeTxHash=0x${'cd'.repeat(32)}` },
  decorators: [
    (Story) => (
      <div className="w-[454px]">
        <AuditLog>
          <AuditRow
            label="Created"
            actionType="created"
            address="0x0000000000000000000000000000000000000123"
            timestamp={STORY_STARTED_AT_MS}
          />
          <Story />
          <AuditRow
            label="Executed"
            actionType="executed"
            address="0x0000000000000000000000000000000000000456"
            timestamp={STORY_STARTED_AT_MS + 120_000}
            isLast
          />
        </AuditLog>
      </div>
    ),
  ],
} satisfies Meta<typeof SafenetHistoryRowView>

export default meta
type Story = StoryObj<typeof meta>

export const Checking: Story = { args: { state: STORY_STATES.checking } }
export const NoIssuesFound: Story = { args: { state: STORY_STATES['no-issues'] } }
export const RiskDetected: Story = { args: { state: STORY_STATES.risk } }
export const Unavailable: Story = { args: { state: STORY_STATES.unavailable } }

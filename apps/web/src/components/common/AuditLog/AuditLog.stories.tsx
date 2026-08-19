import type { Meta, StoryObj } from '@storybook/react'
import { AuditLog, AuditLogHeader, AuditRow } from './index'

/**
 * Rows reflow on a 300px container query against the AuditLog element, not the viewport, so the
 * canvas cannot reach the stacked layout by resizing — `width` below is that container width.
 */
const meta: Meta<typeof AuditLog> = {
  title: 'Components/Common/AuditLog',
  component: AuditLog,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Fixed timestamps — the storybook suite snapshots the formatted output (TZ=UTC).
const CREATED_AT = 1_755_500_000_000
const SIGNED_AT = 1_755_503_600_000
const EXECUTED_AT = 1_755_507_200_000

const OWNER = '0x1234567890123456789012345678901234567890'

const atWidth = (width: number) => () => (
  <div className="bg-card rounded-lg py-4" style={{ width, maxWidth: '100%' }}>
    <AuditLog>
      <AuditLogHeader />
      <AuditRow label="Created" actionType="created" address={OWNER} timestamp={CREATED_AT} />
      <AuditRow
        label="Signed (1/2)"
        actionType="signed"
        address={OWNER}
        name="A deliberately long signer name that has to truncate"
        timestamp={SIGNED_AT}
      />
      <AuditRow label="Waiting" actionType="pending" />
      <AuditRow label="Executed" actionType="executed" address={OWNER} timestamp={EXECUTED_AT} isLast />
    </AuditLog>
  </div>
)

/** Wide panel: label/actor and timestamp share one line. */
export const Default: Story = { render: atWidth(720) }

/** The 33.3% side column on a desktop window. */
export const SideColumn: Story = { render: atWidth(454) }

/** A 390px phone: the column still has room to keep the timestamp on the right. */
export const Mobile: Story = { render: atWidth(310) }

/** A 375px phone — the widest column that stacks, where label and address would start truncating. */
export const AtBreakpoint: Story = { render: atWidth(295) }

/** The 33.3% side column at a mid-size desktop window, where it collapses hardest. */
export const NarrowSideColumn: Story = { render: atWidth(220) }

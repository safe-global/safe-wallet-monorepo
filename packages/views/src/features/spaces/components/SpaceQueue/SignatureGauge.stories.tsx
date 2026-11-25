import type { Meta, StoryObj } from '@storybook/react'
import SignatureGauge, { type SignatureGaugeTone } from './SignatureGauge'

const meta = {
  title: 'Features/Spaces/Transactions/SignatureGauge',
  component: SignatureGauge,
  args: { count: 1, threshold: 3 },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof SignatureGauge>

export default meta
type Story = StoryObj<typeof meta>

export const Partial: Story = {}

/** Without a status: neutral until the threshold is met */
export const AllSteps: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-sm tabular-nums">
      {[0, 1, 2, 3].map((count) => (
        <span key={count} className="flex items-center gap-1.5">
          <SignatureGauge count={count} threshold={3} />
          {count}/3
        </span>
      ))}
    </div>
  ),
}

const STATES: Array<{ label: string; count: number; threshold: number; tone: SignatureGaugeTone }> = [
  { label: 'Ready to sign', count: 0, threshold: 2, tone: 'success' },
  { label: 'Ready to execute', count: 2, threshold: 2, tone: 'success' },
  { label: 'Signing', count: 1, threshold: 3, tone: 'warning' },
  { label: 'Blocked by #12', count: 3, threshold: 3, tone: 'warning' },
]

/** The queue's statuses: green when the user can sign or execute now, amber when they must wait */
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-[auto_auto] items-center gap-x-6 gap-y-3 text-sm tabular-nums">
      {STATES.map(({ label, count, threshold, tone }) => (
        <div key={label} className="contents">
          <span className="flex items-center gap-1.5">
            <SignatureGauge count={count} threshold={threshold} tone={tone} />
            {count}/{threshold}
          </span>
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  ),
}

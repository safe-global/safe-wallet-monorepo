import type { Meta, StoryObj } from '@storybook/react'
import { SignatureGauge } from './SignatureGauge'

const meta = {
  title: 'Features/Spaces/Pending queue prototype/Signature gauge',
  component: SignatureGauge,
  args: { count: 1, threshold: 3 },
} satisfies Meta<typeof SignatureGauge>

export default meta
type Story = StoryObj<typeof meta>

export const Partial: Story = {}

export const AllSteps: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-xs tabular-nums">
      {[0, 1, 2, 3].map((count) => (
        <span key={count} className="flex items-center gap-1.5">
          <SignatureGauge count={count} threshold={3} />
          {count}/3
        </span>
      ))}
    </div>
  ),
}

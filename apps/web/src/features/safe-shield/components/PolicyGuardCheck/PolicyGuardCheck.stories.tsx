import type { Meta, StoryObj } from '@storybook/react'
import PolicyGuardCheck from './index'

const meta: Meta<typeof PolicyGuardCheck> = {
  title: 'Features/SafeShield/PolicyGuardCheck',
  component: PolicyGuardCheck,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Passed: Story = {
  args: { isAllowed: true },
}

export const Refused: Story = {
  args: { blocked: { status: 'no-policy' }, isAllowed: false },
}

export const RefusedSafeGasLimit: Story = {
  args: { blocked: { status: 'unsupported', reason: 'NonZeroSafeTxGas' }, isAllowed: false },
}

import type { Meta, StoryObj } from '@storybook/react'
import CooldownButton from './index'

const meta = {
  component: CooldownButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CooldownButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    cooldown: 30,
    onClick: () => console.log('clicked'),
    children: 'Resend',
  },
}

export const StartDisabled: Story = {
  args: {
    cooldown: 10,
    startDisabled: true,
    onClick: () => console.log('clicked'),
    children: 'Resend code',
  },
}

export const LongCooldown: Story = {
  args: {
    cooldown: 60,
    onClick: () => console.log('clicked'),
    children: 'Try again',
  },
}

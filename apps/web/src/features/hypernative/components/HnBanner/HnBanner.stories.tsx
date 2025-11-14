import type { Meta, StoryObj } from '@storybook/react'
import { HnBanner } from './HnBanner'

const meta = {
  component: HnBanner,
  title: 'Features/Hypernative/HnBanner',
  tags: ['autodocs'],
} satisfies Meta<typeof HnBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onHnSignupClick: () => console.log('Signup clicked'),
    onDismiss: () => console.log('Dismissed'),
  },
}

export const NonDismissable: Story = {
  args: {
    onHnSignupClick: () => console.log('Signup clicked'),
    onDismiss: undefined,
  },
}

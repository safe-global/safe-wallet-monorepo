import type { Meta, StoryObj } from '@storybook/react'
import HnBanner from './HnBanner'

const meta = {
  component: HnBanner,
  title: 'Features/Hypernative/HnBanner',
  tags: ['autodocs'],
} satisfies Meta<typeof HnBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onDismiss: () => {},
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { HnMiniTxBanner } from './HnMiniTxBanner'

const meta = {
  component: HnMiniTxBanner,
  title: 'Features/Hypernative/HnMiniTxBanner',
  tags: ['autodocs'],
} satisfies Meta<typeof HnMiniTxBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onHnSignupClick: () => console.log('Signup clicked'),
  },
}


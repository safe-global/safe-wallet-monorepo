import type { Meta, StoryObj } from '@storybook/react'
import FeeInfoBanner from './index'

const meta = {
  title: 'Features/GTF/FeeInfoBanner',
  component: FeeInfoBanner,
  tags: ['autodocs'],
} satisfies Meta<typeof FeeInfoBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

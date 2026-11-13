import type { Meta, StoryObj } from '@storybook/react'
import FeeInfoBanner from './index'

const meta = {
  title: 'Features/FeePayment/FeeInfoBanner',
  component: FeeInfoBanner,
  tags: ['autodocs'],
  args: { onDismiss: () => {} },
} satisfies Meta<typeof FeeInfoBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

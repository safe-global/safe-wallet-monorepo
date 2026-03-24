import type { Meta, StoryObj } from '@storybook/react'
import FeesPreview from './index'

const meta = {
  title: 'Features/GTF/FeesPreview',
  component: FeesPreview,
  tags: ['autodocs'],
} satisfies Meta<typeof FeesPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    executionFee: { label: 'Execution fee' },
    gasFee: { label: 'Gas fee', amount: '0.0002733', currency: 'ETH' },
  },
}

export const Loading: Story = {
  args: {
    executionFee: { label: 'Execution fee' },
    gasFee: { label: 'Gas fee', amount: '> 0.001', currency: 'ETH' },
    loading: true,
  },
}

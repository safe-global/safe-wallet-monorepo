import type { Meta, StoryObj } from '@storybook/react'
import SimilarityWarning from './SimilarityWarning'

const meta = {
  title: 'Features/MyAccounts/SimilarityWarning',
  component: SimilarityWarning,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SimilarityWarning>

export default meta
type Story = StoryObj<typeof meta>

export const HighRisk: Story = {
  args: {
    riskLevel: 'high',
  },
}

export const MediumRisk: Story = {
  args: {
    riskLevel: 'medium',
  },
}

export const LowRisk: Story = {
  args: {
    riskLevel: 'low',
  },
}

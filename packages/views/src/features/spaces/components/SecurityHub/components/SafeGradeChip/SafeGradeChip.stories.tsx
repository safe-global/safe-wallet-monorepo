import type { Meta, StoryObj } from '@storybook/react'
import SafeGradeChip from './SafeGradeChip'

const meta = {
  title: 'Features/SecurityHub/SafeGradeChip',
  component: SafeGradeChip,
  tags: ['autodocs'],
  argTypes: {
    grade: {
      control: 'select',
      options: ['critical', 'at_risk', 'needs_attention', 'passing'],
    },
    active: { control: 'boolean' },
  },
} satisfies Meta<typeof SafeGradeChip>

export default meta
type Story = StoryObj<typeof meta>

export const Critical: Story = {
  args: { grade: 'critical', label: '1 critical' },
}

export const AtRisk: Story = {
  args: { grade: 'at_risk', label: '3 at risk' },
}

export const NeedsAttention: Story = {
  args: { grade: 'needs_attention', label: '2 needs review' },
}

export const Passing: Story = {
  args: { grade: 'passing', label: '12 healthy' },
}

export const ActiveFilter: Story = {
  args: { grade: 'critical', label: '1 critical', active: true, onClick: () => {} },
}

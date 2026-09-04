import type { Meta, StoryObj } from '@storybook/react'
import CloudCosignerBadge from '.'

const meta = {
  title: 'Features/CloudCosigner/CloudCosignerBadge',
  component: CloudCosignerBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof CloudCosignerBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

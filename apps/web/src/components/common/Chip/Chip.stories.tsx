import type { Meta, StoryObj } from '@storybook/react'
import { Chip } from './index'

const meta = {
  component: Chip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const CustomLabel: Story = {
  args: {
    label: 'Testing VRT',
  },
}

export const NormalFontWeight: Story = {
  args: {
    label: 'New',
    fontWeight: 'normal',
  },
}

export const WithCustomStyling: Story = {
  args: {
    label: 'Featured',
    sx: {
      backgroundColor: 'secondary.main',
      color: 'white',
    },
  },
}

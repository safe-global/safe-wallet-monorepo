import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import AddTrustedSafesCard from '.'

const meta = {
  title: 'Common/AddTrustedSafesCard',
  component: AddTrustedSafesCard,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AddTrustedSafesCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onAdd: () => alert('Manage trusted Safes'),
  },
}

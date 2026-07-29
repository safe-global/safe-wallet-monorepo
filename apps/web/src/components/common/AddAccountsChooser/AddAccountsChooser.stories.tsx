import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import AddAccountsChooser from '.'

const meta = {
  title: 'Common/AddAccountsChooser',
  component: AddAccountsChooser,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AddAccountsChooser>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Secondary: Story = {
  args: { buttonVariant: 'secondary' },
}

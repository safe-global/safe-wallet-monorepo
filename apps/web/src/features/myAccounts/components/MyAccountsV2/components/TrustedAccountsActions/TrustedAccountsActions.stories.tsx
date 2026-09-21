import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import TrustedAccountsActions from '.'

const meta = {
  title: 'MyAccounts/TrustedAccountsActions',
  component: TrustedAccountsActions,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TrustedAccountsActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onManage: () => alert('Manage list') },
}

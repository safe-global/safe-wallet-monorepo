import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import NonPinnedWarning from './index'

const meta = {
  title: 'Features/MyAccounts/NonPinnedWarning',
  component: NonPinnedWarning,
  decorators: [withMockProvider()],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    safeAddress: '0x1234567890123456789012345678901234567890',
    safeName: undefined,
    chainId: '1',
    hasSimilarAddress: false,
    similarAddresses: [],
    isConfirmDialogOpen: false,
    onOpenConfirmDialog: () => alert('Open dialog'),
    onCloseConfirmDialog: () => alert('Close dialog'),
    onConfirmAdd: () => alert('Confirm add'),
    onDismiss: () => alert('Dismiss clicked'),
  },
} satisfies Meta<typeof NonPinnedWarning>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithSafeName: Story = {
  args: {
    safeName: 'My Treasury Safe',
  },
}

export const DialogOpen: Story = {
  args: {
    isConfirmDialogOpen: true,
    safeName: 'My Safe',
  },
}

export const DialogOpenWithSimilarAddress: Story = {
  args: {
    isConfirmDialogOpen: true,
    hasSimilarAddress: true,
    similarAddresses: [{ address: '0x1234567890123456789012345678901234567891', name: 'My Treasury Safe' }],
  },
}

export const DialogOpenWithMultipleSimilarAddresses: Story = {
  args: {
    isConfirmDialogOpen: true,
    hasSimilarAddress: true,
    similarAddresses: [
      { address: '0x1234567890123456789012345678901234567891', name: 'My Treasury Safe' },
      { address: '0x1234567890123456789012345678901234567892' },
    ],
  },
}

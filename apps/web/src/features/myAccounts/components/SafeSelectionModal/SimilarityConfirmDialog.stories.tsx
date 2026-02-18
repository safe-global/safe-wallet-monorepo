import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import type { SelectableSafe } from '../../hooks/useSafeSelectionModal.types'

const baseSafe: SelectableSafe = {
  chainId: '1',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  name: 'Suspicious Safe',
  isPinned: false,
  isReadOnly: false,
  lastVisited: 0,
  isSelected: false,
  similarityGroup: '123456_5678',
}

const meta = {
  title: 'Features/MyAccounts/SimilarityConfirmDialog',
  component: SimilarityConfirmDialog,
  decorators: [withMockProvider()],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SimilarityConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const HighRisk: Story = {
  args: {
    open: true,
    safe: baseSafe,
    onConfirm: () => alert('Confirmed!'),
    onCancel: () => alert('Cancelled'),
  },
}

export const WithName: Story = {
  args: {
    open: true,
    safe: { ...baseSafe, name: 'My Treasury Safe' },
    onConfirm: () => alert('Confirmed!'),
    onCancel: () => alert('Cancelled'),
  },
}

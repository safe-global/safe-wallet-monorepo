import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import type { SelectableSafe } from './useTrustedSafesModal.types'
import { INTRA_LIST_MATCH } from '@/features/address-poisoning'

const baseSafe: SelectableSafe = {
  chainId: '1',
  address: '0x1234567890abcdef1234567890abcdef12345678',
  name: 'Suspicious Safe',
  isPinned: false,
  isReadOnly: false,
  lastVisited: 0,
  isSelected: false,
  similarity: { match: INTRA_LIST_MATCH },
}

const meta = {
  title: 'Common/SimilarityConfirmDialog',
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

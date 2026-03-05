import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import PinnedSafes from './index'
import type { AllSafeItems } from '@/hooks/safes'

const meta = {
  title: 'Features/MyAccounts/PinnedSafes',
  component: PinnedSafes,
  decorators: [withMockProvider()],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PinnedSafes>

export default meta
type Story = StoryObj<typeof meta>

const pinnedSafes: AllSafeItems = [
  {
    name: 'Main Treasury',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    isPinned: true,
    chainId: '1',
    isReadOnly: false,
    lastVisited: Date.now(),
  },
  {
    name: 'Optimism Safe',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    isPinned: true,
    chainId: '10',
    isReadOnly: false,
    lastVisited: Date.now() - 1000 * 60 * 60,
  },
]

export const WithPinnedSafes: Story = {
  args: {
    allSafes: pinnedSafes,
    onOpenSelectionModal: () => alert('Open selection modal'),
  },
}

export const EmptyState: Story = {
  args: {
    allSafes: [],
    onOpenSelectionModal: () => alert('Open selection modal'),
  },
}

export const EmptyStateWithoutButton: Story = {
  args: {
    allSafes: [],
    onOpenSelectionModal: undefined,
  },
}

export const NoPinnedWithOtherSafes: Story = {
  args: {
    allSafes: [
      {
        name: 'Unpinned Safe',
        address: '0x9876543210fedcba9876543210fedcba98765432',
        isPinned: false,
        chainId: '1',
        isReadOnly: false,
        lastVisited: Date.now(),
      },
    ],
    onOpenSelectionModal: () => alert('Open selection modal'),
  },
}

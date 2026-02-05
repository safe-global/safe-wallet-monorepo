import type { Meta, StoryObj } from '@storybook/react'
import SafeSelectionModal from './index'
import type { UseSafeSelectionModalReturn } from '../../hooks/useSafeSelectionModal'

const baseMockModal: UseSafeSelectionModalReturn = {
  isOpen: true,
  availableItems: [
    {
      chainId: '1',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'My Main Safe',
      isPinned: false,
      isReadOnly: false,
      lastVisited: 0,
      isSelected: false,
      similarityGroup: undefined,
    },
    {
      chainId: '1',
      address: '0xabcdef1234567890abcdef1234567890abcdef12',
      name: 'Savings Safe',
      isPinned: true,
      isReadOnly: false,
      lastVisited: 0,
      isSelected: true,
      similarityGroup: undefined,
    },
    {
      chainId: '10',
      address: '0x9876543210fedcba9876543210fedcba98765432',
      name: 'Optimism Safe',
      isPinned: false,
      isReadOnly: true,
      lastVisited: 0,
      isSelected: false,
      similarityGroup: undefined,
    },
  ],
  selectedAddresses: new Set(['0xabcdef1234567890abcdef1234567890abcdef12']),
  pendingConfirmation: null,
  pendingSelectAllConfirmation: false,
  similarAddressesForSelectAll: [],
  searchQuery: '',
  isLoading: false,
  hasChanges: false,
  totalSafesCount: 3,
  open: () => {},
  close: () => {},
  toggleSelection: () => {},
  selectAll: () => {},
  deselectAll: () => {},
  confirmSimilarAddress: () => {},
  cancelSimilarAddress: () => {},
  confirmSelectAll: () => {},
  cancelSelectAll: () => {},
  submitSelection: () => {},
  setSearchQuery: () => {},
}

const meta = {
  title: 'Features/MyAccounts/SafeSelectionModal',
  component: SafeSelectionModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SafeSelectionModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    modal: baseMockModal,
  },
}

export const WithChanges: Story = {
  args: {
    modal: {
      ...baseMockModal,
      hasChanges: true,
      availableItems: baseMockModal.availableItems.map((safe, i) => (i === 0 ? { ...safe, isSelected: true } : safe)),
      selectedAddresses: new Set([
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xabcdef1234567890abcdef1234567890abcdef12',
      ]),
    },
  },
}

export const WithSimilarAddresses: Story = {
  args: {
    modal: {
      ...baseMockModal,
      availableItems: [
        ...baseMockModal.availableItems,
        {
          chainId: '1',
          address: '0x123456eeeeeeeeeeeeeeeeeeeeeeeeee12345678',
          name: 'Suspicious Safe',
          isPinned: false,
          isReadOnly: false,
          lastVisited: 0,
          isSelected: false,
          similarityGroup: '123456_5678',
        },
      ],
    },
  },
}

export const WithPendingConfirmation: Story = {
  args: {
    modal: {
      ...baseMockModal,
      pendingConfirmation: '0x123456eeeeeeeeeeeeeeeeeeeeeeeeee12345678',
      availableItems: [
        ...baseMockModal.availableItems,
        {
          chainId: '1',
          address: '0x123456eeeeeeeeeeeeeeeeeeeeeeeeee12345678',
          name: 'Suspicious Safe',
          isPinned: false,
          isReadOnly: false,
          lastVisited: 0,
          isSelected: false,
          similarityGroup: '123456_5678',
        },
      ],
    },
  },
}

export const Loading: Story = {
  args: {
    modal: {
      ...baseMockModal,
      isLoading: true,
      availableItems: [],
    },
  },
}

export const Empty: Story = {
  args: {
    modal: {
      ...baseMockModal,
      availableItems: [],
    },
  },
}

export const WithSelectAllConfirmation: Story = {
  args: {
    modal: {
      ...baseMockModal,
      pendingSelectAllConfirmation: true,
      similarAddressesForSelectAll: [
        {
          chainId: '1',
          address: '0x123456eeeeeeeeeeeeeeeeeeeeeeeeee12345678',
          name: 'Suspicious Safe 1',
          isPinned: false,
          isReadOnly: false,
          lastVisited: 0,
          isSelected: false,
          similarityGroup: '123456_5678',
        },
        {
          chainId: '1',
          address: '0x123456ffffffffffffffffffffffffff12345678',
          name: 'Suspicious Safe 2',
          isPinned: false,
          isReadOnly: false,
          lastVisited: 0,
          isSelected: false,
          similarityGroup: '123456_5678',
        },
      ],
    },
  },
}

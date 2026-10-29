import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/decorators'
import SimilarityConfirmDialog from './SimilarityConfirmDialog'
import type { SelectableSafe } from './useTrustedSafesModal.types'

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
  title: 'Components/Common/TrustedSafesModal/SimilarityConfirmDialog',
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

export const AddressBookContact: Story = {
  args: {
    open: true,
    safe: { address: baseSafe.address },
    description:
      'This address is similar to an address in your address book. This could indicate an address poisoning attack.',
    addressLabel: 'Address',
    hint: 'Verify the full address carefully. Continue only if you recognize this address.',
    onConfirm: () => alert('Confirmed!'),
    onCancel: () => alert('Cancelled'),
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import SelectAllConfirmDialog from './SelectAllConfirmDialog'

const SIMILAR_ADDRESSES = [
  { address: '0x4b8D483068ec1A31B550b53E7d6201332Cac21a0', name: 'Vendor A' },
  { address: '0xc5E28161073aFC4eB60139949EE86F07679c07fd', name: 'Payroll' },
  { address: '0x6E54912FF1F763f537ab7880Ba3e025F8cceD894', name: 'Exchange deposit' },
  { address: '0x87B2C99D5DEB8f4aa9BFb25858c38dB77f8f6245', name: 'Market maker' },
  { address: '0x0B11290b33917Cc79212C8B3c6eD77E8E564F16a', name: 'Grant recipient' },
]

const meta = {
  title: 'Components/Common/TrustedSafesModal/SelectAllConfirmDialog',
  component: SelectAllConfirmDialog,
  decorators: [withMockProvider()],
  parameters: {
    layout: 'centered',
  },
  args: {
    open: true,
    similarAddresses: SIMILAR_ADDRESSES.slice(0, 2),
    onConfirm: () => alert('Included'),
    onSkip: () => alert('Skipped'),
    onCancel: () => alert('Cancelled'),
  },
} satisfies Meta<typeof SelectAllConfirmDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** More than three rows scroll inside the list; the buttons stay in place. */
export const ManyAddresses: Story = {
  args: { similarAddresses: SIMILAR_ADDRESSES },
}

export const AddressBookImport: Story = {
  args: {
    similarAddresses: SIMILAR_ADDRESSES,
    description: `${SIMILAR_ADDRESSES.length} addresses in this file closely resemble addresses in your address book. Review them carefully before continuing.`,
    question: 'Do you want to import these addresses?',
    confirmLabel: 'Yes, import them anyway',
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { withMockProvider } from '@/storybook/preview'
import AddressWithCopy from '.'

const SAMPLE = '0x1234567890abcdef1234567890abcdef12345678'

const meta = {
  title: 'Common/AddressWithCopy',
  component: AddressWithCopy,
  decorators: [withMockProvider({ shadcn: true })],
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AddressWithCopy>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { address: SAMPLE },
}

export const FullAddress: Story = {
  args: { address: SAMPLE, full: true },
}

export const WithExplorerLink: Story = {
  args: {
    address: SAMPLE,
    full: true,
    explorerLink: { href: `https://etherscan.io/address/${SAMPLE}`, title: 'View on Etherscan' },
  },
}

export const WithoutCopy: Story = {
  args: { address: SAMPLE, showCopy: false },
}

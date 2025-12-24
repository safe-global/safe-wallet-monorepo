import type { Meta, StoryObj } from '@storybook/react'
import WalletIcon from './index'

const meta = {
  component: WalletIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WalletIcon>

export default meta
type Story = StoryObj<typeof meta>

// MetaMask fox SVG icon (simplified)
const METAMASK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 318.6 318.6"><path fill="#E2761B" d="M274.1 35.5l-99.5 73.9L193 65.8z"/><path fill="#E4761B" d="M44.4 35.5l98.7 74.6-17.5-44.3zm193.9 171.3l-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9l16.2 55.3 56.7-15.6-26.5-40.6z"/></svg>`

export const Default: Story = {
  args: {
    provider: 'MetaMask',
    icon: METAMASK_ICON,
  },
}

export const SmallSize: Story = {
  args: {
    provider: 'MetaMask',
    icon: METAMASK_ICON,
    width: 20,
    height: 20,
  },
}

export const LargeSize: Story = {
  args: {
    provider: 'MetaMask',
    icon: METAMASK_ICON,
    width: 50,
    height: 50,
  },
}

export const NoIcon: Story = {
  args: {
    provider: 'Unknown Wallet',
  },
}

export const DataUri: Story = {
  args: {
    provider: 'WalletConnect',
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjwvc3ZnPg==',
  },
}

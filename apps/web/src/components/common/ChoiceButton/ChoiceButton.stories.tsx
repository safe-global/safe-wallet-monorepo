import type { Meta, StoryObj } from '@storybook/react'
import { Box } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AddIcon from '@mui/icons-material/Add'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import ChoiceButton from './index'

const meta = {
  component: ChoiceButton,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <Box sx={{ width: 300 }}>
        <Story />
      </Box>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ChoiceButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Send tokens',
    description: 'Send tokens to another address',
    icon: SendIcon,
    onClick: () => console.log('clicked'),
  },
}

export const WithChip: Story = {
  args: {
    title: 'Swap tokens',
    description: 'Exchange one token for another',
    icon: SwapHorizIcon,
    onClick: () => console.log('clicked'),
    chip: 'New',
  },
}

export const WithIconColor: Story = {
  args: {
    title: 'Add funds',
    description: 'Deposit funds into your Safe',
    icon: AddIcon,
    iconColor: 'success',
    onClick: () => console.log('clicked'),
  },
}

export const NoDescription: Story = {
  args: {
    title: 'Connect wallet',
    icon: AccountBalanceWalletIcon,
    onClick: () => console.log('clicked'),
  },
}

export const Disabled: Story = {
  args: {
    title: 'Send tokens',
    description: 'Send tokens to another address',
    icon: SendIcon,
    onClick: () => console.log('clicked'),
    disabled: true,
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import SrcEthHashInfo from './index'
import { Paper } from '@mui/material'

const meta = {
  component: SrcEthHashInfo,
  parameters: {
    componentSubtitle: 'Renders a hash address with options for copy and explorer link',
  },

  decorators: [
    (Story) => {
      return (
        <Paper sx={{ padding: 2 }}>
          <Story />
        </Paper>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SrcEthHashInfo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
  },
}

export const WithName: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    name: 'Real OG',
  },
}

export const WithOnlyName: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    name: 'Real OG',
    onlyName: true,
  },
}

export const WithAvatar: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    name: 'Real OG',
    showAvatar: true,
    avatarSize: 30,
  },
}

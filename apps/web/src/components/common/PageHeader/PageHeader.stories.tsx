import type { Meta, StoryObj } from '@storybook/react'
import { Button, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/Settings'
import PageHeader from './index'

const meta = {
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Transactions',
  },
}

export const WithButton: Story = {
  args: {
    title: 'Address book',
    action: (
      <Button variant="contained" startIcon={<AddIcon />}>
        Add entry
      </Button>
    ),
  },
}

export const WithIconButton: Story = {
  args: {
    title: 'Settings',
    action: (
      <IconButton>
        <SettingsIcon />
      </IconButton>
    ),
  },
}

export const NoBorder: Story = {
  args: {
    title: 'My Assets',
    noBorder: true,
  },
}

export const LongTitle: Story = {
  args: {
    title: 'Transaction queue and history overview',
    action: <Button variant="outlined">Export</Button>,
  },
}

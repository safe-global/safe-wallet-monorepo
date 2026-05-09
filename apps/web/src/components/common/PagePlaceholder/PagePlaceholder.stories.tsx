import type { Meta, StoryObj } from '@storybook/react'
import { Paper, Button } from '@mui/material'
import InboxIcon from '@mui/icons-material/Inbox'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import PagePlaceholder from './index'

const meta: Meta<typeof PagePlaceholder> = {
  title: 'Components/Common/PagePlaceholder',
  component: PagePlaceholder,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <Paper sx={{ padding: 4, minWidth: 400, minHeight: 300, display: 'flex', alignItems: 'center' }}>
        <Story />
      </Paper>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    img: <InboxIcon sx={{ fontSize: 64, color: 'text.secondary' }} />,
    text: 'No transactions found',
  },
}

export const Error: Story = {
  args: {
    img: <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />,
    text: 'Something went wrong. Please try again.',
    children: (
      <Button variant="contained" sx={{ mt: 2 }}>
        Retry
      </Button>
    ),
  },
}

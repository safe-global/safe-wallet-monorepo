import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import NavTabs from './index'

const meta: Meta<typeof NavTabs> = {
  title: 'Components/Common/NavTabs',
  component: NavTabs,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: false,
      router: { pathname: '/transactions/queue', query: { safe: 'eth:0x1234567890123456789012345678901234567890' } },
    },
  },
  decorators: [
    (Story) => (
      <Paper sx={{ p: 2 }}>
        <Story />
      </Paper>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    tabs: [
      { label: 'Queue', href: '/transactions/queue' },
      { label: 'History', href: '/transactions/history' },
      { label: 'Messages', href: '/transactions/messages' },
    ],
  },
}

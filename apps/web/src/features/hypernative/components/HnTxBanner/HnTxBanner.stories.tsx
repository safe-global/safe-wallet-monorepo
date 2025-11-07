import type { Meta, StoryObj } from '@storybook/react'
import HnTxBanner from './HnTxBanner'
import { Paper, Stack } from '@mui/material'

const meta = {
  component: HnTxBanner,
  title: 'Features/Hypernative/HnTxBanner',
  parameters: {
    componentSubtitle:
      'A transaction banner component that displays a security report review link with checkmark icon (light theme) and external link icon.',
  },
  decorators: [
    (Story) => {
      return (
        <Paper sx={{ padding: 2, maxWidth: 600, backgroundColor: 'transparent' }}>
          <Story />
        </Paper>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof HnTxBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    text: 'Review security report',
    href: '#',
  },
}


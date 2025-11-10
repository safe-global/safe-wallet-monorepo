import type { Meta, StoryObj } from '@storybook/react'
import { HnPendingBanner } from './HnPendingBanner'
import { Paper } from '@mui/material'

const meta = {
  component: HnPendingBanner,
  title: 'Features/Hypernative/HnPendingBanner',
  parameters: {
    componentSubtitle:
      'A banner component that displays a pending guardian setup status with an icon and close button.',
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
} satisfies Meta<typeof HnPendingBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onHnSignupClick: () => console.log('Signup clicked'),
    onDismiss: () => console.log('Dismissed'),
  },
}

export const NonDismissable: Story = {
  args: {
    onHnSignupClick: () => console.log('Signup clicked'),
    onDismiss: undefined,
  },
}

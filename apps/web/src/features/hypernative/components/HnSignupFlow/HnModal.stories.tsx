import type { Meta, StoryObj } from '@storybook/react'
import { Box, Typography } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import HnModal from './HnModal'

const meta = {
  component: HnModal,
  title: 'Features/Hypernative/HnModal',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <Story />
      </StoreDecorator>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A reusable modal component for Hypernative Guardian features. Automatically adapts to light and dark themes. Use the theme switcher in the toolbar to toggle between themes.',
      },
    },
  },
} satisfies Meta<typeof HnModal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    onClose: () => console.log('Modal closed'),
    children: (
      <Box p={4}>
        <Typography variant="h4" gutterBottom>
          Modal Content
        </Typography>
        <Typography>This is the content inside the Hypernative modal.</Typography>
      </Box>
    ),
  },
}

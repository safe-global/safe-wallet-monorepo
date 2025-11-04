import type { Meta, StoryObj } from '@storybook/react'
import NativeSwapsCard from './index'
import { Box } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  component: NativeSwapsCard,
  parameters: {
    componentSubtitle: 'Renders a promo card for native swaps',
  },

  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{ chains: { data: [{ chainId: '11155111', features: ['NATIVE_SWAPS'] }] } }}>
          <Box sx={{ maxWidth: '500px' }}>
            <Story />
          </Box>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof NativeSwapsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

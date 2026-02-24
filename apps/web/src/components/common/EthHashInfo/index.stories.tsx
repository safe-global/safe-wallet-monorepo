import type { Meta, StoryObj } from '@storybook/react'
import EthHashInfo from './index'
import { Paper } from '@mui/material'

import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'

const meta = {
  component: EthHashInfo,
  parameters: {
    componentSubtitle: 'Renders a hash address with options for copy and explorer link',
  },

  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <RouterDecorator>
            <Paper sx={{ padding: 2 }}>
              <Story />
            </Paper>
          </RouterDecorator>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof EthHashInfo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
  },
}

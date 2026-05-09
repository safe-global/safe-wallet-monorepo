import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { NestedSafeCreation } from './index'
import { mockNestedSafeCreationTxData } from './mockData'

const meta = {
  component: NestedSafeCreation,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <Paper sx={{ padding: 2 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof NestedSafeCreation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    txData: mockNestedSafeCreationTxData,
  },
}

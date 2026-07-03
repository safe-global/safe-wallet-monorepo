import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import { NestedSafeCreation } from './index'
import { mockNestedSafeCreationTxData } from './mockData'

const meta = {
  title: 'Components/TxFlow/ConfirmationViews/NestedSafeCreation',
  component: NestedSafeCreation,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <div className="rounded-lg bg-background p-4">
            <Story />
          </div>
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

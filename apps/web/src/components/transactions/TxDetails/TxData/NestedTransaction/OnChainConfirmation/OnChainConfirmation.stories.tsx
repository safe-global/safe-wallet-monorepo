import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import { OnChainConfirmation } from './index'
import { mockOnChainConfirmationData, mockNestedTxDetails } from './mockData'
import { http, HttpResponse } from 'msw'

const meta = {
  title: 'Components/Transactions/OnChainConfirmation',
  component: OnChainConfirmation,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <div className="p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],
  parameters: {
    msw: {
      handlers: [
        http.get('*/v1/chains/:chainId/transactions/:id', () => {
          return HttpResponse.json(mockNestedTxDetails)
        }),
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OnChainConfirmation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    data: mockOnChainConfirmationData,
    isConfirmationView: false,
  },
}

export const ConfirmationView: Story = {
  args: {
    data: mockOnChainConfirmationData,
    isConfirmationView: true,
  },
}

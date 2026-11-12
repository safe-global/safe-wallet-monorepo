import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import { ManageSigners } from './index'
import { mockAddOwnerTxInfo, mockRemoveOwnerTxInfo, mockSwapOwnerTxInfo, mockTxData } from './mockData'
import { mockAddress } from '@/stories/mocks/address'

const meta = {
  title: 'Components/TxFlow/ConfirmationViews/ManageSigners',
  component: ManageSigners,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator
          initialState={{
            safeInfo: {
              data: {
                address: { value: mockAddress(10) },
                chainId: '1',
                nonce: 100,
                threshold: 2,
                owners: [
                  {
                    value: mockAddress(11),
                    name: 'Owner 1',
                    logoUri: null,
                  },
                  {
                    value: mockAddress(12),
                    name: 'Owner 2',
                    logoUri: null,
                  },
                  {
                    value: mockAddress(13),
                    name: 'Owner 3',
                    logoUri: null,
                  },
                ],
                implementation: { value: mockAddress(14) },
                modules: null,
                fallbackHandler: null,
                guard: null,
                version: '1.3.0',
              },
              loading: false,
            },
          }}
        >
          <div className="rounded-lg bg-background p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ManageSigners>

export default meta
type Story = StoryObj<typeof meta>

export const AddOwner: Story = {
  args: {
    txInfo: mockAddOwnerTxInfo,
    txData: mockTxData,
  },
}

export const RemoveOwner: Story = {
  args: {
    txInfo: mockRemoveOwnerTxInfo,
    txData: mockTxData,
  },
}

export const SwapOwner: Story = {
  args: {
    txInfo: mockSwapOwnerTxInfo,
    txData: mockTxData,
  },
}

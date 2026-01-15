import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { ManageSigners } from './index'
import { mockAddOwnerTxInfo, mockRemoveOwnerTxInfo, mockSwapOwnerTxInfo, mockTxData } from './mockData'
import { faker } from '@faker-js/faker'

// Use a different seed than mockData.ts (789) to avoid address collisions
faker.seed(999)

const meta = {
  component: ManageSigners,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator
          initialState={{
            safeInfo: {
              data: {
                address: { value: faker.finance.ethereumAddress() },
                chainId: '1',
                nonce: 100,
                threshold: 2,
                owners: [
                  {
                    value: faker.finance.ethereumAddress(),
                    name: 'Owner 1',
                    logoUri: null,
                  },
                  {
                    value: faker.finance.ethereumAddress(),
                    name: 'Owner 2',
                    logoUri: null,
                  },
                  {
                    value: faker.finance.ethereumAddress(),
                    name: 'Owner 3',
                    logoUri: null,
                  },
                ],
                implementation: { value: faker.finance.ethereumAddress() },
                modules: null,
                fallbackHandler: null,
                guard: null,
                version: '1.3.0',
              },
              loading: false,
            },
          }}
        >
          <Paper sx={{ padding: 2 }}>
            <Story />
          </Paper>
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

import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { ExecTransaction } from './index'
import { mockExecTransactionData } from './mockData'
import { http, HttpResponse } from 'msw'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

const meta = {
  component: ExecTransaction,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator
          initialState={{
            chains: {
              data: [
                {
                  chainId: '1',
                  chainName: 'Ethereum',
                  shortName: 'eth',
                },
              ],
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
  parameters: {
    msw: {
      handlers: [
        http.post('*/v1/chains/:chainId/data-decoder', () => {
          return HttpResponse.json({
            txInfo: {
              type: TransactionInfoType.TRANSFER,
              humanDescription: null,
            },
            txData: {
              hexData: '0x',
              dataDecoded: null,
              to: {
                value: '0x1234567890123456789012345678901234567890',
                name: null,
                logoUri: null,
              },
              value: '1000000000000000000',
              operation: 0,
              trustedDelegateCallTarget: null,
              addressInfoIndex: null,
            },
          })
        }),
      ],
    },
  },
  // Skip visual regression tests until baseline snapshots are generated
  tags: ['autodocs', '!test'],
} satisfies Meta<typeof ExecTransaction>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    data: mockExecTransactionData,
    isConfirmationView: false,
  },
}

export const ConfirmationView: Story = {
  args: {
    data: mockExecTransactionData,
    isConfirmationView: true,
  },
}

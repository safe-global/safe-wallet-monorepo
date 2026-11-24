import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { Interface } from 'ethers'
import { createMockStory } from '@/stories/mocks'
import { GnosisPayTxDetails } from './GnosisPayTxDetails'
const setup = createMockStory({ scenario: 'efSafe', wallet: 'disconnected', layout: 'paper' })
const recipient = '0x0000000000000000000000000000000000000020'
const calldata = new Interface(['function approve(address spender,uint256 amount)']).encodeFunctionData('approve', [
  recipient,
  10n,
])
const preview = http.post('*/v1/chains/:chain/transactions/:safe/preview', () =>
  HttpResponse.json({
    txData: {
      dataDecoded: {
        method: 'approve',
        parameters: [
          { name: 'spender', type: 'address', value: recipient },
          { name: 'amount', type: 'uint256', value: '10' },
        ],
      },
    },
  }),
)
const meta = {
  title: 'Features/GnosisPay/Queued transaction details',
  component: GnosisPayTxDetails,
  decorators: [setup.decorator],
  parameters: { ...setup.parameters, msw: { handlers: [preview, ...setup.handlers] } },
  args: { txData: { to: recipient, value: '1000000000000000000', data: calldata } },
} satisfies Meta<typeof GnosisPayTxDetails>
export default meta
type Story = StoryObj<typeof meta>
export const DecodedApproval: Story = {}
export const DecoderUnavailable: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('*/v1/chains/:chain/transactions/:safe/preview', () => HttpResponse.json({}, { status: 503 })),
        ...setup.handlers,
      ],
    },
  },
}

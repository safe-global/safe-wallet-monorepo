import type { Meta, StoryObj } from '@storybook/react'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import { createMockStory } from '@/stories/mocks'
import { mockAddress } from '@/stories/mocks/address'
import { basicTypesActions } from '../MethodDetails/mockData'
import Multisend from '.'

const setup = createMockStory({ shadcn: true })

const multiSendTxData: TransactionData = {
  hexData: '0x8d80ff0a0000000000000000000000000000000000000000000000000000000000000020',
  dataDecoded: {
    method: 'multiSend',
    parameters: [{ name: 'transactions', type: 'bytes', value: '0x', valueDecoded: basicTypesActions }],
  },
  to: { value: mockAddress(3), name: 'MultiSendCallOnly', logoUri: null },
  value: '0',
  operation: Operation.DELEGATE,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
  tokenInfoIndex: null,
}

const meta = {
  title: 'Components/Transactions/Multisend',
  component: Multisend,
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
  args: {
    txData: multiSendTxData,
  },
} satisfies Meta<typeof Multisend>

export default meta
type Story = StoryObj<typeof meta>

/** The Transaction Builder batch QA uses to cover all ABI types, collapsed. */
export const AllAbiTypes: Story = {}

export const AllAbiTypesExpanded: Story = {
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    await userEvent.click(within(canvasElement).getByTestId('expande-all-btn'))
  },
}

export const Compact: Story = {
  args: {
    compact: true,
  },
}

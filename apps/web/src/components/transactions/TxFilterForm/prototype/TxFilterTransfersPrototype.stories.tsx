import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import TxFilterTransfersPrototype from './TxFilterTransfersPrototype'

/**
 * Layout prototype for WA-3937: a "Transfers only" toggle inside the Outgoing filter.
 * Nothing is submitted and no transactions are loaded.
 */

const contacts = {
  [checksumAddress('0x23cbcbbc748c961e570cfc05ff65554ecb8955e9')]: 'Payroll provider',
  [checksumAddress('0x1111111111111111111111111111111111111111')]: 'Treasury multisig',
  [checksumAddress('0x2222222222222222222222222222222222222222')]: 'Alice',
}

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'none',
  pathname: '/transactions/history',
  store: { addressBook: { 1: contacts, [DEFAULT_CHAIN_ID]: contacts } },
})

const meta = {
  title: 'Components/Transactions/TxFilterForm/TransfersOnlyPrototype',
  component: TxFilterTransfersPrototype,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
  },
  decorators: [setup.decorator],
} satisfies Meta<typeof TxFilterTransfersPrototype>

export default meta
type Story = StoryObj<typeof meta>

export const ToggleOff: Story = {}

export const ToggleOn: Story = {
  args: { initialValues: { transfers: true } },
}

export const ToggleOnFilled: Story = {
  args: {
    initialValues: {
      transfers: true,
      execution_date__gte: new Date('2026-01-01T00:00:00'),
      execution_date__lte: new Date('2026-01-10T00:00:00'),
      to: '0x23cbCbbC748c961E570Cfc05Ff65554ECB8955E9',
      token_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
  },
}

/** The recipient suggestions from the address book, opened with the chevron. */
export const RecipientListOpen: Story = {
  args: { initialValues: { transfers: true } },
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    await userEvent.click(await within(canvasElement).findByTestId('address-book-toggle'))
  },
}

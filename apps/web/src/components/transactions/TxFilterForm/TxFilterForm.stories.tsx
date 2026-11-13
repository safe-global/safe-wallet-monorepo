import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import TxFilterForm from './index'

const contacts = {
  [checksumAddress('0x23cbcbbc748c961e570cfc05ff65554ecb8955e9')]: 'Payroll provider',
  [checksumAddress('0x1111111111111111111111111111111111111111')]: 'Treasury multisig',
  [checksumAddress('0x2222222222222222222222222222222222222222')]: 'Alice',
}

const storyWithFilter = (query: Record<string, string>): Story => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'none',
    pathname: '/transactions/history',
    query,
    store: { addressBook: { 1: contacts, [DEFAULT_CHAIN_ID]: contacts } },
  })

  return { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
}

const meta = {
  title: 'Components/Transactions/TxFilterForm',
  component: TxFilterForm,
  parameters: { layout: 'centered' },
  args: { onClose: () => {} },
  render: (args) => (
    <div className="w-[min(720px,calc(100vw-2rem))] rounded-xl border border-border bg-card shadow-md">
      <TxFilterForm {...args} />
    </div>
  ),
} satisfies Meta<typeof TxFilterForm>

export default meta
type Story = StoryObj<typeof meta>

export const Incoming: Story = storyWithFilter({})

export const Outgoing: Story = storyWithFilter({ type: 'Outgoing' })

export const OutgoingWhoWasPaid: Story = storyWithFilter({
  type: 'Outgoing',
  transfers: 'true',
  execution_date__gte: '2026-01-01T00:00:00.000Z',
  execution_date__lte: '2026-01-10T23:59:59.999Z',
  to: '0x23cbCbbC748c961E570Cfc05Ff65554ECB8955E9',
  token_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
})

export const OutgoingAddressCalled: Story = storyWithFilter({
  type: 'Outgoing',
  to: '0x23cbCbbC748c961E570Cfc05Ff65554ECB8955E9',
  nonce: '64',
})

/** The recipient suggestions from the address book, opened with the chevron. */
export const OutgoingRecipientList: Story = {
  ...storyWithFilter({ type: 'Outgoing' }),
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    await userEvent.click(await within(canvasElement).findByTestId('address-book-toggle'))
  },
}

export const ModuleBased: Story = storyWithFilter({ type: 'Module-based' })

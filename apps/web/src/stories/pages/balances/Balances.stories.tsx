import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { OperationType } from '@safe-global/types-kit'
import { SAFE_ADDRESSES } from '@safe-global/test/msw/fixtures'
import { createMockStory, type StoreOverrides } from '@/stories/mocks'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import Balances from '@/pages/balances'

/**
 * Balances page - displays the user's token balances.
 * Includes total asset value, token list, and currency selection.
 */

const balancesSetup = (store: StoreOverrides = {}) => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'fullPage',
    pathname: '/balances',
    store,
  })
  return { parameters: setup.parameters, decorators: [setup.decorator] }
}

const { address: SAFE_ADDRESS, chainId: CHAIN_ID } = SAFE_ADDRESSES.efSafe

const batchWithOneTransfer = {
  [CHAIN_ID]: {
    [SAFE_ADDRESS]: [
      {
        id: 'draft-0',
        timestamp: 0,
        txData: {
          to: '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC',
          value: '1000000000000000',
          data: '0x',
          operation: OperationType.Call,
        },
      },
    ],
  },
}

const meta = {
  title: 'Pages/Core/Balances',
  component: Balances,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Balances>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = balancesSetup()

export const AllTokensWithDust: Story = balancesSetup({
  settings: { hideDust: false, tokenList: TOKEN_LISTS.ALL },
})

export const BatchSidebarOpen: Story = {
  ...balancesSetup({ batch: batchWithOneTransfer }),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole('button', { name: 'Batch transactions' }))
  },
}

export const SidebarCollapsed: Story = {
  ...balancesSetup(),
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByTestId('sidebar-trigger'))
  },
}

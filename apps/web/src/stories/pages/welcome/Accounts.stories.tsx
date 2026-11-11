import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { expect, waitFor } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import type { MockStoryConfig } from '@/stories/mocks/types'
import Accounts from '@/pages/welcome/accounts'

/**
 * My Accounts page - displays all user's Safe accounts.
 * Shows a list of Safes the user has access to across networks.
 */

const meta = {
  title: 'Pages/Onboarding/MyAccounts',
  component: Accounts,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Accounts>

export default meta
type Story = StoryObj<typeof meta>

// The rows show a threshold and a balance only once the Safe overviews load; until then they show skeletons
const accountsStory = (config: MockStoryConfig, loadedTexts: string[]): Story => {
  const setup = createMockStory({
    scenario: 'efSafe',
    pathname: '/welcome/accounts',
    features: { myAccounts: true },
    layout: 'fullPage',
    ...config,
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
    play: async ({ canvasElement }) => {
      await waitFor(() => loadedTexts.forEach((text) => expect(canvasElement).toHaveTextContent(text)), {
        timeout: 10_000,
      })
    },
  }
}

// Safes that the mock Safe overview handler serves, so every row shows its balance
const OWNER = { value: '0x8aEf2f5c3F17261F6F1C4dA058D022BE92776af8' }
const TREASURY = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
const PAYROLL = '0xB63F3D0a4a7eFd1d0c08A9ef17C5e5d3DbBDE867'
const OPERATIONS = '0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01'

// Balances without the currency sign: the app puts a hair space after it
export const Default: Story = accountsStory({ wallet: 'connected' }, ['3/5', '48,251'])

export const AddedSafesNoWallet: Story = accountsStory(
  {
    wallet: 'disconnected',
    store: {
      addedSafes: {
        '1': {
          [TREASURY]: { owners: [OWNER], threshold: 3 },
          [PAYROLL]: { owners: [OWNER], threshold: 1 },
        },
        '137': {
          [OPERATIONS]: { owners: [OWNER], threshold: 2 },
        },
      },
      addressBook: {
        '1': { [TREASURY]: 'Treasury', [PAYROLL]: 'Payroll' },
        '137': { [OPERATIONS]: 'Operations' },
      },
    },
  },
  ['2/3', '1/2', '3/5', '5,430', '12,780', '48,251'],
)

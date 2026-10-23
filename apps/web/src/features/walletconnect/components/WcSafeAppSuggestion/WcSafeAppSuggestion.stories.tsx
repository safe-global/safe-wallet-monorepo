import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { createMockStory } from '@/stories/mocks'
import WcSafeAppSuggestion from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

const safeApp: SafeAppData = {
  id: 1,
  url: 'https://app.morpho.org',
  name: 'Morpho',
  iconUrl: 'https://app.morpho.org/favicon.ico',
  description: 'Lending and borrowing',
  chainIds: ['1'],
  accessControl: { type: 'NO_RESTRICTIONS' },
  tags: ['lending'],
  features: [],
  socialProfiles: [],
  featured: false,
}

const meta = {
  title: 'Features/WalletConnect/WcSafeAppSuggestion',
  component: WcSafeAppSuggestion,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
  args: {
    safeApp,
    origin: 'https://app.morpho.org',
    onOpenSafeApp: () => {},
    onContinueWithWalletConnect: () => {},
    onBrowseSafeApps: () => {},
  },
} satisfies Meta<typeof WcSafeAppSuggestion>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** A missing registry icon must still leave the placeholder in place. */
export const NoIcon: Story = {
  args: {
    safeApp: { ...safeApp, iconUrl: null },
  },
}

export const LongAppName: Story = {
  args: {
    safeApp: { ...safeApp, name: 'Some Protocol With A Very Long Name' },
    origin: 'https://app.some-protocol-with-a-very-long-name.example',
  },
}

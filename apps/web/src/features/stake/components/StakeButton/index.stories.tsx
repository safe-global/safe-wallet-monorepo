import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { TokenType } from '@safe-global/store/gateway/types'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { createMockStory } from '@/stories/mocks'
import { STAKE_LABELS } from '@/services/analytics/events/stake'
import StakeButton from './index'

const nativeToken: Balance['tokenInfo'] = {
  address: '0x0000000000000000000000000000000000000000',
  decimals: 18,
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
  name: 'Ether',
  symbol: 'ETH',
  type: TokenType.NATIVE_TOKEN,
}

// Owner wallet + initialized SDK -> CheckWallet resolves to enabled.
const enabledSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/balances',
  shadcn: true,
})

// Disconnected wallet -> CheckWallet disables the button and shows a "connect wallet" tooltip.
const disabledSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  pathname: '/balances',
  shadcn: true,
})

const meta = {
  title: 'Features/Stake/StakeButton',
  component: StakeButton,
  loaders: [mswLoader],
  parameters: {
    layout: 'centered',
  },
  args: {
    tokenInfo: nativeToken,
    trackingLabel: STAKE_LABELS.asset,
  },
} satisfies Meta<typeof StakeButton>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Default compact button, enabled for a connected Safe owner.
 */
export const Enabled: Story = {
  decorators: [enabledSetup.decorator],
  parameters: {
    ...enabledSetup.parameters,
  },
}

/**
 * Full-width outline variant (compact=false), enabled for a Safe owner.
 */
export const Outline: Story = {
  args: {
    compact: false,
  },
  decorators: [enabledSetup.decorator],
  parameters: {
    ...enabledSetup.parameters,
  },
}

/**
 * Icon-only variant with a "Stake" tooltip on hover.
 */
export const IconOnly: Story = {
  args: {
    onlyIcon: true,
  },
  decorators: [enabledSetup.decorator],
  parameters: {
    ...enabledSetup.parameters,
  },
}

/**
 * Disabled state: no wallet connected, so CheckWallet blocks the action
 * and renders a tooltip prompting the user to connect a wallet.
 */
export const Disabled: Story = {
  decorators: [disabledSetup.decorator],
  parameters: {
    ...disabledSetup.parameters,
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import type { SpendingLimitState } from '../../types'
import ReviewSpendingLimitTx from './index'

// First owner of the `efSafe` fixture — this is the address the `owner` wallet
// preset connects with, so it must match the spending-limit beneficiary for
// `useSpendingLimit` to resolve a limit for the selected token.
const OWNER_ADDRESS = '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F'
const RECIPIENT_ADDRESS = '0x1234567890123456789012345678901234567890'

// Real tokens present in the `efSafe` balances fixture, so `useBalances` finds
// them and `SendAmountBlock` renders the token amount + fiat value.
const USDC = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
}
const ETH = {
  address: '0x0000000000000000000000000000000000000000',
  symbol: 'ETH',
  decimals: 18,
}

const spendingLimit = (token: typeof USDC): SpendingLimitState => ({
  beneficiary: OWNER_ADDRESS,
  token: { address: token.address, symbol: token.symbol, decimals: token.decimals },
  amount: '500000000',
  spent: '0',
  nonce: '0',
  resetTimeMin: '0',
  lastResetMin: '0',
})

// The `efSafe` fixture has `modules: null`, so `useSpendingLimitGas` early-returns
// and no on-chain gas estimation is performed — the review renders fully in
// isolation without a live wallet/provider.
const makeSetup = (token: typeof USDC) =>
  createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    pathname: '/balances',
    shadcn: true,
    store: {
      spendingLimits: { data: [spendingLimit(token)], loading: false, loaded: true },
    },
  })

const meta = {
  title: 'Features/SpendingLimits/ReviewSpendingLimitTx',
  component: ReviewSpendingLimitTx,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
  },
  args: {
    onSubmit: () => {},
  },
} satisfies Meta<typeof ReviewSpendingLimitTx>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Reviewing a spending-limit transfer of an ERC-20 token (USDC) to a recipient.
 * Shows the info banner, token amount block, recipient block, advanced params
 * and the Execute action.
 */
export const Default: Story = (() => {
  const setup = makeSetup(USDC)
  return {
    args: {
      params: { recipient: RECIPIENT_ADDRESS, tokenAddress: USDC.address, amount: '100' },
    },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

/**
 * Reviewing a spending-limit transfer of the native token (ETH).
 */
export const NativeToken: Story = (() => {
  const setup = makeSetup(ETH)
  return {
    args: {
      params: { recipient: RECIPIENT_ADDRESS, tokenAddress: ETH.address, amount: '0.5' },
    },
    parameters: { ...setup.parameters },
    decorators: [setup.decorator],
  }
})()

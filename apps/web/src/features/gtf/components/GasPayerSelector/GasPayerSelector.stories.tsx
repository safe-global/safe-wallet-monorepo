import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import GasPayerSelector from './index'
import type { FeePayerView, GasPayerChoice, NetworkFee } from '../../types'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import { createInitialState } from '@/stories/mocks/defaults'
import { safeFixtures } from '@safe-global/test/msw/fixtures'

/**
 * Every screen of the fee payment spec ("Who pays the network fee"), one story per cell of its case
 * table. Toggles keep their own selection so the fee row follows the picked option.
 */
const Harness = ({ view }: { view: FeePayerView }) => {
  const [choice, setChoice] = useState<GasPayerChoice>(
    view.kind === 'sponsored_toggle' || view.kind === 'safe_toggle' ? view.choice : 'WALLET',
  )
  const live: FeePayerView =
    view.kind === 'sponsored_toggle'
      ? { ...view, choice: choice === 'SPONSORED' ? 'SPONSORED' : 'WALLET' }
      : view.kind === 'safe_toggle'
        ? { ...view, choice: choice === 'PAY_FROM_SAFE' ? 'PAY_FROM_SAFE' : 'WALLET' }
        : view

  return (
    <div className="w-[480px]">
      <GasPayerSelector view={live} onChoiceChange={setChoice} />
    </div>
  )
}

const meta = {
  title: 'Features/GTF/GasPayerSelector',
  component: Harness,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => (
      <StoreDecorator
        initialState={createInitialState({
          safeData: safeFixtures.efSafe,
          isDarkMode: context.globals?.theme === 'dark',
        })}
        context={context}
      >
        <RouterDecorator>
          <Story />
        </RouterDecorator>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof Harness>

export default meta
type Story = StoryObj<typeof meta>

const safeFee: NetworkFee = { amount: '0.0001', currency: 'ETH', fiatAmount: '€0.20' }
const signerFee: NetworkFee = { amount: '0.00012', currency: 'ETH', fiatAmount: '€0.24' }
const atExecution: NetworkFee = { note: 'Calculated at execution' }
const ZERO = '0x0000000000000000000000000000000000000000'
const gasTokens = [
  { address: ZERO, symbol: 'ETH', logoUri: '', fiatBalance: '1250.00' },
  { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', logoUri: '', fiatBalance: '10000.00' },
]
const nativeOnly = [gasTokens[0]]

// Sign step, first signer

export const SignFreePlan: Story = {
  name: 'Sign · Free plan (fee + premium)',
  args: {
    view: {
      kind: 'safe_toggle',
      choice: 'WALLET',
      safeFee,
      signerFee: atExecution,
      premium: true,
      reachesThreshold: false,
      gasTokens,
      selectedGasToken: ZERO,
    },
  },
}

export const SignProSponsoredLeft: Story = {
  name: 'Sign · Pro, sponsored left (info line)',
  args: { view: { kind: 'sponsored_info' } },
}

export const SignProNoSponsored: Story = {
  name: 'Sign · Pro, 0 sponsored left (fee, no premium)',
  args: {
    view: {
      kind: 'safe_toggle',
      choice: 'PAY_FROM_SAFE',
      safeFee,
      signerFee: atExecution,
      premium: false,
      reachesThreshold: false,
      gasTokens,
      selectedGasToken: ZERO,
    },
  },
}

export const SignNativeOnly: Story = {
  name: 'Sign · only the native token can pay (M1)',
  args: {
    view: {
      kind: 'safe_toggle',
      choice: 'PAY_FROM_SAFE',
      safeFee,
      signerFee: atExecution,
      premium: false,
      reachesThreshold: false,
      gasTokens: nativeOnly,
      selectedGasToken: ZERO,
    },
  },
}

export const SignAndExecute: Story = {
  name: 'Sign · threshold-reaching signer, Pay from Safe',
  args: {
    view: {
      kind: 'safe_toggle',
      choice: 'PAY_FROM_SAFE',
      safeFee,
      signerFee,
      premium: false,
      reachesThreshold: true,
      gasTokens,
      selectedGasToken: ZERO,
    },
  },
}

export const SignQuoteLoading: Story = {
  name: 'Sign · quote loading',
  args: {
    view: {
      kind: 'safe_toggle',
      choice: 'PAY_FROM_SAFE',
      safeFee: { loading: true },
      signerFee: atExecution,
      premium: false,
      reachesThreshold: false,
      gasTokens,
      selectedGasToken: ZERO,
    },
  },
}

export const SignQuoteError: Story = {
  name: 'Sign · quote error',
  args: {
    view: {
      kind: 'safe_toggle',
      choice: 'PAY_FROM_SAFE',
      safeFee: { error: true },
      signerFee: atExecution,
      premium: false,
      reachesThreshold: false,
      gasTokens,
      selectedGasToken: ZERO,
    },
  },
}

// Execute step

export const ExecuteLocked: Story = {
  name: 'Execute · Pay from Safe locked at signing',
  args: { view: { kind: 'locked', fee: safeFee } },
}

export const ExecuteProSponsoredLeft: Story = {
  name: 'Execute · Pro, sponsored left (toggle)',
  args: { view: { kind: 'sponsored_toggle', choice: 'SPONSORED', counter: '49/50', signerFee } },
}

export const ExecuteProUnlimited: Story = {
  name: 'Execute · Enterprise, unlimited',
  args: { view: { kind: 'sponsored_toggle', choice: 'SPONSORED', counter: 'Unlimited', signerFee } },
}

export const ExecuteDailyFree: Story = {
  name: 'Execute · Core on a daily-free chain',
  args: { view: { kind: 'sponsored_toggle', choice: 'SPONSORED', counter: '1/1 today', signerFee } },
}

export const ExecuteProNoSponsored: Story = {
  name: 'Execute · Pro, 0 sponsored left (text + message)',
  args: { view: { kind: 'signer_only', reason: 'quota', resetsAt: '2026-11-11T13:15:00Z', signerFee } },
}

export const ExecuteFreePlan: Story = {
  name: 'Execute · Free plan (text + upsell)',
  args: { view: { kind: 'signer_only', reason: 'free', resetsAt: null, signerFee } },
}

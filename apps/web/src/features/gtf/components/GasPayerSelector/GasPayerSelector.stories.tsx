import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import GasPayerSelector from './index'
import type { FeePayerView, GasPayerChoice, NetworkFee } from '../../types'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import { createInitialState } from '@/stories/mocks/defaults'
import { safeFixtures } from '@safe-global/test/msw/fixtures'

/**
 * Every screen of the fee payment design (Prototype/Fee payment), one story per cell of its case
 * table. Dropdowns keep their own selection so the fee rows follow the picked option.
 */
const ZERO = '0x0000000000000000000000000000000000000000'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const ETH = {
  address: ZERO,
  symbol: 'ETH',
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
}
const USDC_TOKEN = {
  address: USDC,
  symbol: 'USDC',
  logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
  fiatBalance: '1200',
}

const signerFee: NetworkFee = { amount: '0.0004', currency: 'ETH', fiatAmount: '$1.46' }
const safeFee: NetworkFee = { amount: '0.0004', currency: 'ETH', fiatAmount: '$1.46' }
const feesLine = { amount: '0.0004', currency: 'ETH' }
const outgoing = (withFees: boolean) => ({
  primary: [{ amount: '0.5466', currency: 'ETH' }],
  fees: withFees ? feesLine : undefined,
  fiatTotal: withFees ? '$1,996.55' : '$1,995.09',
})
const free: FeePayerView['footer'] = { kind: 'upsell' }
const pro = (left: number): FeePayerView['footer'] => ({
  kind: 'counter',
  left,
  quota: 50,
  resetsAt: '2026-11-11T00:00:00Z',
})
const safeTokens = {
  tokens: [ETH, USDC_TOKEN],
  selected: ZERO,
  locked: false,
  lockedReason: 'Fees are paid in ETH for now. More tokens are coming soon.',
}
const nativeLocked = { tokens: [ETH], selected: ZERO, locked: true }
const base = { executionFee: {}, sponsored: false }

const Harness = ({ view }: { view: FeePayerView }) => {
  const [choice, setChoice] = useState<GasPayerChoice>(view.payer.value)
  const [token, setToken] = useState(view.gasToken.selected)
  const paysFromSafe = choice === 'PAY_FROM_SAFE'
  const live: FeePayerView = {
    ...view,
    payer: view.payer.kind === 'choice' ? { ...view.payer, value: choice } : view.payer,
    gasToken: { ...view.gasToken, selected: token },
    sponsored: choice === 'SPONSORED',
    gasFee:
      view.payer.kind === 'choice' && !paysFromSafe && view.payer.options.includes('PAY_FROM_SAFE')
        ? signerFee
        : view.gasFee,
    totalOutgoing: view.totalOutgoing && { ...view.totalOutgoing, fees: paysFromSafe ? feesLine : undefined },
  }

  return (
    <div className="w-[600px]">
      <GasPayerSelector view={live} onChoiceChange={setChoice} onGasTokenChange={setToken} />
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

const choice = (value: GasPayerChoice, options: GasPayerChoice[]): FeePayerView['payer'] => ({
  kind: 'choice',
  value,
  options,
})
const locked = (value: GasPayerChoice): FeePayerView['payer'] => ({ kind: 'locked', value })

export const SignFreePlanSafe: Story = {
  name: 'Sign · Free plan · Pay from Safe account',
  args: {
    view: {
      ...base,
      payer: choice('PAY_FROM_SAFE', ['PAY_FROM_SAFE', 'WALLET']),
      gasToken: safeTokens,
      gasFee: safeFee,
      totalOutgoing: outgoing(true),
      footer: free,
    },
  },
}

export const SignFreePlanSigner: Story = {
  name: 'Sign · Free plan · Pay from signer wallet',
  args: {
    view: {
      ...base,
      payer: choice('WALLET', ['PAY_FROM_SAFE', 'WALLET']),
      gasToken: nativeLocked,
      gasFee: signerFee,
      totalOutgoing: outgoing(false),
      footer: free,
    },
  },
}

export const SignProSponsoredLeft: Story = {
  name: 'Sign · Pro, sponsored left (Pro plan, locked)',
  args: {
    view: {
      ...base,
      payer: locked('SPONSORED'),
      gasToken: nativeLocked,
      gasFee: signerFee,
      sponsored: true,
      totalOutgoing: outgoing(false),
      footer: pro(49),
    },
  },
}

export const SignProNoSponsored: Story = {
  name: 'Sign · Pro, 0 sponsored left · Pay from Safe account',
  args: {
    view: {
      ...base,
      payer: choice('PAY_FROM_SAFE', ['PAY_FROM_SAFE', 'WALLET']),
      gasToken: safeTokens,
      gasFee: safeFee,
      totalOutgoing: outgoing(true),
      footer: pro(0),
    },
  },
}

export const SignLaterSignerSafe: Story = {
  name: 'Sign · later signer · Safe account locked at signing',
  args: {
    view: {
      ...base,
      payer: locked('PAY_FROM_SAFE'),
      gasToken: { tokens: [ETH], selected: ZERO, locked: true, lockedReason: "Set at signing and can't be changed." },
      gasFee: safeFee,
      totalOutgoing: outgoing(true),
      footer: free,
    },
  },
}

export const SignLaterSignerWallet: Story = {
  name: 'Sign · later signer · Signer wallet',
  args: {
    view: {
      ...base,
      payer: locked('WALLET'),
      gasToken: nativeLocked,
      gasFee: { note: 'Calculated at execution' },
      totalOutgoing: outgoing(false),
      footer: free,
    },
  },
}

export const SignQuoteLoading: Story = {
  name: 'Sign · quote loading',
  args: {
    view: {
      ...base,
      payer: choice('PAY_FROM_SAFE', ['PAY_FROM_SAFE', 'WALLET']),
      gasToken: safeTokens,
      gasFee: { loading: true },
      footer: free,
    },
  },
}

export const SignQuoteError: Story = {
  name: 'Sign · quote error',
  args: {
    view: {
      ...base,
      payer: choice('PAY_FROM_SAFE', ['PAY_FROM_SAFE', 'WALLET']),
      gasToken: safeTokens,
      gasFee: { error: true },
      footer: free,
    },
  },
}

export const SignInsufficientBalance: Story = {
  name: 'Sign · Safe cannot cover the fee',
  args: {
    view: {
      ...base,
      payer: choice('PAY_FROM_SAFE', ['PAY_FROM_SAFE', 'WALLET']),
      gasToken: safeTokens,
      gasFee: safeFee,
      totalOutgoing: outgoing(true),
      footer: free,
      safeHasEnoughGas: false,
    },
  },
}

export const ExecuteLocked: Story = {
  name: 'Execute · Safe account locked at signing',
  args: {
    view: {
      ...base,
      payer: locked('PAY_FROM_SAFE'),
      gasToken: { tokens: [ETH], selected: ZERO, locked: true, lockedReason: "Set at signing and can't be changed." },
      gasFee: safeFee,
      totalOutgoing: outgoing(true),
      footer: pro(49),
    },
  },
}

export const ExecuteProSponsoredLeft: Story = {
  name: 'Execute · Pro, sponsored left (Pro plan / Signer wallet)',
  args: {
    view: {
      ...base,
      payer: choice('SPONSORED', ['SPONSORED', 'WALLET']),
      gasToken: nativeLocked,
      gasFee: signerFee,
      sponsored: true,
      totalOutgoing: outgoing(false),
      footer: pro(49),
    },
  },
}

export const ExecuteProUnlimited: Story = {
  name: 'Execute · Enterprise, unlimited',
  args: {
    view: {
      ...base,
      payer: choice('SPONSORED', ['SPONSORED', 'WALLET']),
      gasToken: nativeLocked,
      gasFee: signerFee,
      sponsored: true,
      totalOutgoing: outgoing(false),
      footer: { kind: 'counter', left: null, quota: null, resetsAt: null },
    },
  },
}

export const ExecuteSponsoringRanOut: Story = {
  name: 'Execute · Pro, sponsoring ran out before execution',
  args: {
    view: {
      ...base,
      payer: locked('WALLET'),
      gasToken: nativeLocked,
      gasFee: signerFee,
      totalOutgoing: outgoing(false),
      footer: pro(0),
    },
  },
}

export const ExecuteFreePlan: Story = {
  name: 'Execute · Free plan · Signer wallet',
  args: {
    view: {
      ...base,
      payer: locked('WALLET'),
      gasToken: nativeLocked,
      gasFee: signerFee,
      totalOutgoing: outgoing(false),
      footer: free,
    },
  },
}

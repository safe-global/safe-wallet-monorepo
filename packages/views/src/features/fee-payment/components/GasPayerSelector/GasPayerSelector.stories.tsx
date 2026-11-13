import type { Meta, StoryObj } from '@storybook/react'
import { useState, type ReactNode } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import type {
  FeePayerView,
  GasDetailName,
  GasFeeDetails,
  GasPayerChoice,
  NetworkFee,
} from '@safe-global/views/features/fee-payment/types'
import { userEvent, within } from 'storybook/test'
import { withMockProvider } from '@/storybook/decorators'
import TokenIcon from '@/components/common/TokenIcon'
import SponsoredTxsCounter from '@/components/tx/SponsoredTxsCounter'
import GasPayerSelector, { CampaignQuota, ProUpsell, SponsoredQuota, type TokenIconRenderer } from './index'

// Every screen of the fee payment design (Prototype/Fee payment), one story per cell of its case table.
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
  isSubscription: true,
})
const safeTokens: FeePayerView['gasToken'] = {
  tokens: [ETH, USDC_TOKEN],
  selected: ZERO,
  locked: false,
  lockedReason: 'NATIVE_ONLY',
}
const nativeLocked = { tokens: [ETH], selected: ZERO, locked: true }
const base = { executionFee: {}, sponsored: false, sponsorKind: 'plan' as const }

const renderTokenIcon: TokenIconRenderer = ({ logoUri, symbol }) => (
  <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />
)

const storyFooter = (footer: FeePayerView['footer']): ReactNode => {
  if (footer.kind === 'none') return null
  if (footer.kind === 'upsell')
    return (
      <ProUpsell
        upgradeButton={
          <Button variant="outline" size="xs">
            Upgrade to Pro
          </Button>
        }
      />
    )
  if (footer.kind === 'campaign') return <CampaignQuota left={footer.left} limit={footer.limit} />
  if (footer.isSubscription && footer.left !== null && footer.quota !== null)
    return <SponsoredQuota left={footer.left} quota={footer.quota} resetsAt="Nov 11, 00:00 UTC" />
  return <SponsoredTxsCounter {...footer} isPro={footer.isSubscription} />
}

type DetailsSample = 'edit' | 'cannotEstimate' | 'paidFromSafe' | 'proPlan' | 'freeTx'

const ESTIMATE: Record<string, string> = {
  userNonce: '12',
  gasLimit: '79262',
  maxPriorityFeePerGas: '0.05',
  maxFeePerGas: '1.82',
}

/** Sample gas settings for the Gas fee row; the app validates and saves them, the story only keeps the typing. */
const useSampleDetails = (sample?: DetailsSample): GasFeeDetails | undefined => {
  const estimate = sample === 'cannotEstimate' ? { ...ESTIMATE, gasLimit: '' } : ESTIMATE
  const [draft, setDraft] = useState<Record<string, string> | null>(sample === 'cannotEstimate' ? estimate : null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  if (!sample) return undefined

  if (sample === 'paidFromSafe' || sample === 'proPlan' || sample === 'freeTx')
    return {
      mode: 'view',
      open: isViewOpen,
      onOpenChange: setIsViewOpen,
      rows:
        sample === 'paidFromSafe'
          ? [
              { name: 'gasLimit', value: '112400' },
              { name: 'gasPrice', value: '1.9' },
            ]
          : (['gasLimit', 'maxPriorityFeePerGas', 'maxFeePerGas'] as const).map((name) => ({
              name,
              value: ESTIMATE[name],
            })),
      reason: sample === 'paidFromSafe' ? 'PAID_FROM_SAFE' : sample === 'proPlan' ? 'SPONSORED_PLAN' : 'SPONSORED_FREE',
    }

  const names: GasDetailName[] = ['userNonce', 'gasLimit', 'maxPriorityFeePerGas', 'maxFeePerGas']
  return {
    mode: 'edit',
    open: draft !== null,
    onOpenChange: (open) => setDraft(open ? estimate : null),
    fields: names.map((name) => ({
      name,
      value: draft?.[name] ?? '',
      error: name === 'gasLimit' && !draft?.gasLimit ? 'REQUIRED' : undefined,
      autoFocus: name === 'gasLimit' && !estimate.gasLimit,
    })),
    onFieldChange: (name, value) => setDraft((current) => current && { ...current, [name]: value }),
    canSave: !!draft?.gasLimit,
    onSave: () => setDraft(null),
    onCancel: () => setDraft(null),
    onReset: draft && draft.gasLimit !== estimate.gasLimit && estimate.gasLimit ? () => setDraft(estimate) : undefined,
  }
}

const Harness = ({ view, details }: { view: FeePayerView; details?: DetailsSample }) => {
  const gasFeeDetails = useSampleDetails(details)
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
      <GasPayerSelector
        view={live}
        onChoiceChange={setChoice}
        onGasTokenChange={setToken}
        currency="usd"
        renderTokenIcon={renderTokenIcon}
        footer={storyFooter(live.footer)}
        gasFeeDetails={gasFeeDetails}
      />
    </div>
  )
}

const meta = {
  title: 'Features/FeePayment/GasPayerSelector',
  component: Harness,
  parameters: { layout: 'centered' },
  decorators: [withMockProvider()],
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
      gasToken: { tokens: [ETH], selected: ZERO, locked: true, lockedReason: 'SET_AT_SIGNING' },
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
      gasToken: { tokens: [ETH], selected: ZERO, locked: true, lockedReason: 'SET_AT_SIGNING' },
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

export const ExecuteFreeDailyLimit: Story = {
  name: 'Execute · Free, daily free transactions (Free transaction / Signer wallet)',
  args: {
    view: {
      ...base,
      payer: choice('SPONSORED', ['SPONSORED', 'WALLET']),
      gasToken: nativeLocked,
      gasFee: signerFee,
      sponsored: true,
      sponsorKind: 'free',
      totalOutgoing: outgoing(false),
      footer: { kind: 'counter', left: 1, quota: 5, resetsAt: null, isSubscription: false },
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
      footer: { kind: 'counter', left: null, quota: null, resetsAt: null, isSubscription: true },
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

export const SignNoPayFromSafeChain: Story = {
  name: 'Sign · Chain without Pay from Safe or sponsoring',
  args: {
    view: {
      ...base,
      payer: locked('WALLET'),
      gasToken: nativeLocked,
      gasFee: { note: 'Calculated at execution' },
      totalOutgoing: outgoing(false),
      footer: { kind: 'none' },
    },
  },
}

export const SignAsProposer: Story = {
  name: 'Sign · Proposer (picks who pays)',
  args: {
    view: {
      ...base,
      payer: { kind: 'choice', value: 'WALLET', options: ['PAY_FROM_SAFE', 'WALLET'] },
      gasToken: nativeLocked,
      gasFee: { note: 'Calculated at execution' },
      totalOutgoing: outgoing(false),
      footer: free,
    },
  },
}

const executeSigner: FeePayerView = {
  ...base,
  payer: locked('WALLET'),
  gasToken: nativeLocked,
  gasFee: signerFee,
  totalOutgoing: outgoing(false),
  footer: free,
}

const openDetails: Story['play'] = async ({ canvasElement }) => {
  const toggle = within(canvasElement).getByTestId('gas-fee-details-toggle')
  await userEvent.click(toggle)
  toggle.blur()
}

export const ExecuteGasEdit: Story = {
  name: 'Execute · Signer wallet · gas settings (Edit)',
  args: { view: executeSigner, details: 'edit' },
}

export const ExecuteGasEditing: Story = {
  name: 'Execute · Signer wallet · editing gas settings',
  args: { view: executeSigner, details: 'edit' },
  play: openDetails,
}

export const ExecuteGasCannotEstimate: Story = {
  name: 'Execute · Signer wallet · gas cannot be estimated',
  args: { view: { ...executeSigner, gasFee: { error: true } }, details: 'cannotEstimate' },
}

export const ExecuteGasPaidFromSafe: Story = {
  name: 'Execute · Safe account · gas details (View)',
  args: {
    view: {
      ...base,
      payer: locked('PAY_FROM_SAFE'),
      gasToken: { tokens: [ETH], selected: ZERO, locked: true, lockedReason: 'SET_AT_SIGNING' },
      gasFee: safeFee,
      totalOutgoing: outgoing(true),
      footer: free,
    },
    details: 'paidFromSafe',
  },
  play: openDetails,
}

export const ExecuteGasProPlan: Story = {
  name: 'Execute · Pro plan · gas details (View)',
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
    details: 'proPlan',
  },
}

export const ExecuteGasCampaign: Story = {
  name: 'Execute · gas campaign (Free transaction / Signer wallet)',
  args: {
    view: {
      ...base,
      payer: choice('SPONSORED', ['SPONSORED', 'WALLET']),
      gasToken: nativeLocked,
      gasFee: signerFee,
      sponsored: true,
      sponsorKind: 'free',
      totalOutgoing: outgoing(false),
      footer: { kind: 'campaign', left: 3, limit: 5 },
    },
    details: 'freeTx',
  },
}

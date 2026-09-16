import type { Meta, StoryObj } from '@storybook/react'
import { useContext, useState } from 'react'
import FeesPreview from './index'
import type { FeesPreviewData } from '../../hooks/useFeesPreview'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import type { GtfPaymentMode } from '@/features/gtf/types'
import { StoreDecorator } from '@/stories/storeDecorator'
import { RouterDecorator } from '@/stories/routerDecorator'
import { createInitialState } from '@/stories/mocks/defaults'
import { safeFixtures } from '@safe-global/test/msw/fixtures'
import { http, HttpResponse } from 'msw'
import { createChainData, createChainsPageDataV2 } from '@/stories/mocks/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

// The checkbox is gated on a chain feature the shared fixtures do not carry, and
// `useCurrentChain` resolves through the v2 chains list. Enable it across that list for the
// opt-in stories rather than editing the shared fixture.
const withSafenetChecks = (chain: Chain): Chain => ({
  ...chain,
  features: [...chain.features, FEATURES.SAFENET_CHECKS],
})

const safenetChainsPage = () => {
  const page = createChainsPageDataV2(withSafenetChecks(createChainData()))
  return { ...page, results: page.results.map(withSafenetChecks) }
}

const safenetChainHandlers = [http.get(/\/v2\/chains$/, () => HttpResponse.json(safenetChainsPage()))]

/**
 * The panel reads the chain and the display currency from the store, and both the payment mode
 * and the Safenet opt-in from SafeTxContext — so the story holds those in state, which makes the
 * "Pay fees from" selector and the Safenet checkbox actually switch rather than snapping back.
 */
type HarnessProps = FeesPreviewData & { initialSafenetCheck?: boolean }

const PaymentModeHarness = ({ initialSafenetCheck = false, ...props }: HarnessProps) => {
  const defaults = useContext(SafeTxContext)
  const [gtfPaymentMode, setGtfPaymentMode] = useState<GtfPaymentMode>('safe')
  const [safenetCheckEnabled, setSafenetCheckEnabled] = useState(initialSafenetCheck)

  return (
    <SafeTxContext.Provider
      value={{ ...defaults, gtfPaymentMode, setGtfPaymentMode, safenetCheckEnabled, setSafenetCheckEnabled }}
    >
      <div className="w-[420px]">
        <FeesPreview {...props} />
      </div>
    </SafeTxContext.Provider>
  )
}

const meta = {
  title: 'Features/GTF/FeesPreview',
  component: PaymentModeHarness,
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
} satisfies Meta<typeof PaymentModeHarness>

export default meta
type Story = StoryObj<typeof meta>

const defaultArgs: FeesPreviewData = {
  canCoverFees: true,
  executionFee: {
    label: 'Execution fee',
    isFree: true,
  },
  gasFee: { label: 'Gas fee', amount: '0.02733', currency: 'ETH', fiatAmount: '$97.30' },
  totalOutgoing: { primary: [{ amount: '0.60126', currency: 'ETH' }], fiatTotal: '$1,768.85' },
  availableGasTokens: [{ address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', logoUri: '' }],
  selectedGasToken: '0x0000000000000000000000000000000000000000',
  onGasTokenChange: () => {},
}

export const Default: Story = {
  args: defaultArgs,
}

export const TwoCurrencies: Story = {
  args: {
    ...defaultArgs,
    totalOutgoing: {
      primary: [{ amount: '0.5466', currency: 'ETH' }],
      fees: { amount: '3.50', currency: 'USDC' },
      fiatTotal: '$1,068.00',
    },
  },
}

export const Loading: Story = {
  args: { ...defaultArgs, loading: true },
}

export const Error: Story = {
  args: { ...defaultArgs, error: true },
}

export const FallbackEOA: Story = {
  args: {
    canCoverFees: false,
    executionFee: { label: 'Execution fee', isFree: true },
    gasFee: { label: 'Gas fee', amount: '0.02733', currency: 'ETH', fiatAmount: '$97.30' },
    totalOutgoing: { primary: [{ amount: '0.60126', currency: 'ETH' }], fiatTotal: '$1,768.95' },
    availableGasTokens: [{ address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', logoUri: '' }],
    selectedGasToken: '0x0000000000000000000000000000000000000000',
  },
}

export const Confirmation: Story = {
  args: {
    ...defaultArgs,
    isConfirmation: true,
  },
}

export const ConfirmationTwoCurrencies: Story = {
  args: {
    ...defaultArgs,
    isConfirmation: true,
    totalOutgoing: {
      primary: [{ amount: '0.5466', currency: 'ETH' }],
      fees: { amount: '3.50', currency: 'USDC' },
      fiatTotal: '$1,068.00',
    },
  },
}

export const FallbackEOATwoCurrencies: Story = {
  args: {
    canCoverFees: false,
    executionFee: { label: 'Execution fee', isFree: true },
    gasFee: { label: 'Gas fee', amount: '0.02733', currency: 'ETH', fiatAmount: '$97.30' },
    totalOutgoing: {
      primary: [{ amount: '0.5466', currency: 'ETH' }],
      fees: { amount: '3.50', currency: 'USDC' },
      fiatTotal: '$1,068.00',
    },
    availableGasTokens: [{ address: '0x0000000000000000000000000000000000000000', symbol: 'ETH', logoUri: '' }],
    selectedGasToken: '0x0000000000000000000000000000000000000000',
  },
}

export const FallbackNoGtfAmount: Story = {
  args: {
    canCoverFees: false,
    executionFee: { label: 'Execution fee', isFree: true },
    gasFee: { label: 'Gas fee', amount: '3.50', currency: 'ETH', fiatAmount: '$3.50' },
  },
}

/**
 * A Safenet chain, check not requested: the checkbox is offered and off, so no fee is quoted
 * and the card keeps its two rows.
 */
export const SafenetCheckAvailable: Story = {
  args: defaultArgs,
  parameters: { msw: { handlers: safenetChainHandlers } },
}

/**
 * The checked result. The CGW answers on the GTF arm — `feeBreakdown` (USD end-to-end) and no
 * `relayCost` — so the Safenet fee renders in the primary slot and the gas fiat comes from
 * `totalUsd`.
 */
export const SafenetFee: Story = {
  args: {
    ...defaultArgs,
    initialSafenetCheck: true,
    safenetFee: { label: 'Safenet fee', amount: '$\u200A1.00' },
    gasFee: { label: 'Max gas fee', amount: '0.02733', currency: 'ETH', fiatAmount: '$\u200A97.30' },
  },
  parameters: { msw: { handlers: safenetChainHandlers } },
}

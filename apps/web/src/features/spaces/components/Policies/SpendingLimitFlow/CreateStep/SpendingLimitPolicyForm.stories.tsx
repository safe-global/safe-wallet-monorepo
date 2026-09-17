import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { fn } from 'storybook/test'
import type { Erc20TokenMetadata } from '@safe-global/store/gateway/AUTO_GENERATED/tokens'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { createMockStory } from '@/stories/mocks'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { useSafeScope, useSafeScopeControls } from '@/components/tx-flow/safe-scope'
import type { SafeScopeTarget } from '@/components/tx-flow/safe-scope'
import { buildSafeAccountId, groupSafeAccounts } from '../../SafeAccountSelector/utils'
import type { SafeAccountEntry, SafeAccountOption } from '../../SafeAccountSelector/types'
import { createDefaultFormValues, type SpendingLimitPolicyFormValues } from '../types'
import SpendingLimitPolicyForm, { type SpendingLimitPolicyFormProps } from './SpendingLimitPolicyForm'

/** `SAFE_ADDRESSES.efSafe` in config/test/msw/fixtures. */
const EF_SAFE = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
const OPS_SAFE = '0x86753FE4b8E29Ce8A38cDf9559D80E05b00cdBA0'
const NICOLE = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const DEV = '0x1F2504De05f5167650bE5B28c472601Be434b60A'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

const efSafeTarget: SafeScopeTarget = { chainId: '1', safeAddress: EF_SAFE }

/** CGW's batch token-metadata route. USDT is not held by efSafe, so it has no price. */
const TOKENS_ROUTE = /\/v1\/chains\/\d+\/tokens(\?|$)/
const popularTokens: Erc20TokenMetadata[] = [
  { address: USDT, symbol: 'USDT', name: 'Tether USD', decimals: 6, logoUri: '', trusted: true, type: 'ERC20' },
]
const popularTokensHandler = http.get(TOKENS_ROUTE, () => HttpResponse.json(popularTokens))

const account = (chainId: string, address: string, extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, address),
  chainId,
  address,
  threshold: 3,
  owners: 5,
  eligibility: 'signer',
  chain: {
    chainId,
    chainName: chainId === '1' ? 'Ethereum' : 'Polygon',
    chainLogoUri: null,
    shortName: chainId === '1' ? 'eth' : 'matic',
  },
  fiatTotal: '123720',
  ...extra,
})

const accounts: SafeAccountEntry[] = [
  account('1', EF_SAFE, { name: 'Treasury' }),
  ...groupSafeAccounts([
    account('1', OPS_SAFE, { name: 'Team operations' }),
    account('137', OPS_SAFE, { name: 'Team operations' }),
  ]),
]

const filledValues: SpendingLimitPolicyFormValues = {
  safe: buildSafeAccountId('1', EF_SAFE),
  spenders: [
    {
      address: NICOLE,
      limits: [
        { tokenAddress: ZERO_ADDRESS, amount: '0.0005', resetTime: '1440' },
        { tokenAddress: USDC, amount: '250', resetTime: '10080' },
      ],
    },
    { address: DEV, limits: [{ tokenAddress: ZERO_ADDRESS, amount: '0.01', resetTime: '0' }] },
  ],
}

type StoryProps = Partial<SpendingLimitPolicyFormProps> & { initialSafe?: SafeScopeTarget }

/** Moves the SafeScope as the step does, so the TokenSelector sees the picked Safe. */
const ScopedForm = ({ initialSafe: _initialSafe, ...props }: StoryProps) => {
  const { setScope } = useSafeScopeControls()
  const scopeKey = useSafeScope()?.scopeKey
  const [isCalloutDismissed, setIsCalloutDismissed] = useState(false)
  return (
    <SpendingLimitPolicyForm
      defaultValues={createDefaultFormValues()}
      onSubmit={fn()}
      accounts={accounts}
      isAccountsLoading={false}
      isAccountsError={false}
      onRetryAccounts={fn()}
      hasWallet
      isCalloutDismissed={isCalloutDismissed}
      onDismissCallout={() => setIsCalloutDismissed(true)}
      onSafeChange={setScope}
      scopeKey={scopeKey}
      {...props}
    />
  )
}

const FormInScope = (props: StoryProps) => (
  <SafeScopeProvider initial={props.initialSafe}>
    <ScopedForm {...props} />
  </SafeScopeProvider>
)

const setup = createMockStory({ scenario: 'efSafe', wallet: 'connected', shadcn: true })

const meta = {
  title: 'Features/Spaces/Policies/SpendingLimitPolicyForm',
  component: FormInScope,
  parameters: {
    layout: 'centered',
    ...setup.parameters,
    msw: { handlers: [popularTokensHandler, ...setup.handlers] },
  },
  decorators: [
    setup.decorator,
    // The policy dialog's card width.
    (Story) => (
      <div className="w-[577px]">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof FormInScope>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const SafeSelected: Story = {
  args: {
    initialSafe: efSafeTarget,
    defaultValues: { ...createDefaultFormValues(), safe: buildSafeAccountId('1', EF_SAFE) },
  },
}

export const Filled: Story = {
  args: { initialSafe: efSafeTarget, defaultValues: filledValues },
}

/** USDT is popular but not held, so it has no price and the fiat line says so. */
export const PriceUnavailable: Story = {
  args: {
    initialSafe: efSafeTarget,
    defaultValues: {
      safe: buildSafeAccountId('1', EF_SAFE),
      spenders: [{ address: NICOLE, limits: [{ tokenAddress: USDT, amount: '100', resetTime: '43200' }] }],
    },
  },
}

export const NoEligibleAccounts: Story = {
  args: { accounts: [] },
}

export const AccountsLoading: Story = {
  tags: ['skip-visual-test'],
  args: { accounts: [], isAccountsLoading: true },
}

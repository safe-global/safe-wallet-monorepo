import type { Meta, StoryObj, Decorator } from '@storybook/react'
import { useEffect, type ReactElement } from 'react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import SafeTxProvider from '@/components/tx-flow/SafeTxProvider'
import { SafeShieldProvider } from '@/features/safe-shield/public/components/SafeShieldProvider'
import { CustomTokensProvider, useAddCustomToken } from '@/components/common/CustomTokensProvider'
import useChainId from '@/hooks/useChainId'
import type { TokenOption } from '@/utils/tokenOptions'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../public/types'
import CreateSpendingLimit from './index'

// The token picker lists the `efSafe` balances, the native currency and the chain's popular tokens, so the
// form needs the mock harness. It reads prefilled values and `onNext` from TxFlowContext, and pasted tokens
// from CustomTokensProvider, which the flow mounts above it.
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/balances/settings',
  shadcn: true,
})

// A token pasted earlier that is on no trusted list, as the custom-token lookup returns it.
const UNTRUSTED_TOKEN: TokenOption = {
  address: '0xc4bF5CbDaBE595361438F8c6a187bDc330539c60',
  symbol: 'GHO',
  name: 'Gho Token',
  decimals: 18,
  group: 'custom',
  untrusted: true,
}

const SeedCustomToken = ({ token, children }: { token: TokenOption; children: ReactElement }): ReactElement => {
  const chainId = useChainId()
  const addToken = useAddCustomToken()
  useEffect(() => addToken(chainId, token), [addToken, chainId, token])
  return children
}

const withPastedToken = (token: TokenOption): Decorator => {
  const decorator: Decorator = (Story) => (
    <CustomTokensProvider>
      <SeedCustomToken token={token}>{Story()}</SeedCustomToken>
    </CustomTokensProvider>
  )
  return decorator
}

const TxFlowContextWrapper = ({
  data,
  children,
}: {
  data?: NewSpendingLimitFlowProps
  children: ReactElement
}): ReactElement => {
  const value: TxFlowContextType<NewSpendingLimitFlowProps> = {
    ...initialContext,
    data,
    onNext: () => {},
  }
  // The address-poisoning check needs SafeShieldProvider, which TxFlow supplies in the real tree.
  // SafeTxProvider stays outside it, as in TxFlow — SafeShieldProvider reads SafeTxContext.
  return (
    <SafeTxProvider>
      <SafeShieldProvider>
        <TxFlowContext.Provider value={value}>{children}</TxFlowContext.Provider>
      </SafeShieldProvider>
    </SafeTxProvider>
  )
}

const withTxFlowContext = (data?: NewSpendingLimitFlowProps): Decorator => {
  const decorator: Decorator = (Story) => <TxFlowContextWrapper data={data}>{Story()}</TxFlowContextWrapper>
  return decorator
}

const meta = {
  title: 'Features/SpendingLimits/CreateSpendingLimit',
  component: CreateSpendingLimit,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof CreateSpendingLimit>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Empty form — no beneficiary, token, or amount selected yet. The reset timer
 * defaults to the "One time" option.
 */
export const Empty: Story = {
  decorators: [
    withTxFlowContext({
      [SpendingLimitFields.beneficiary]: '',
      [SpendingLimitFields.tokenAddress]: '',
      [SpendingLimitFields.amount]: '',
      [SpendingLimitFields.resetTime]: '0',
    }),
    defaultSetup.decorator,
  ],
}

/**
 * A pasted token on no trusted list is picked: the warning replaces the balance line under the token field.
 */
export const UntrustedTokenPicked: Story = {
  decorators: [
    withTxFlowContext({
      [SpendingLimitFields.beneficiary]: '0x1234567890123456789012345678901234567890',
      [SpendingLimitFields.tokenAddress]: UNTRUSTED_TOKEN.address,
      [SpendingLimitFields.amount]: '5',
      [SpendingLimitFields.resetTime]: '0',
    }),
    withPastedToken(UNTRUSTED_TOKEN),
    defaultSetup.decorator,
  ],
}

/**
 * Prefilled form — a beneficiary, token, amount, and a weekly reset period are
 * already set (e.g. when the user navigates back to this step).
 */
export const Prefilled: Story = {
  decorators: [
    withTxFlowContext({
      [SpendingLimitFields.beneficiary]: '0x1234567890123456789012345678901234567890',
      [SpendingLimitFields.tokenAddress]: '0x0000000000000000000000000000000000000000',
      [SpendingLimitFields.amount]: '1.5',
      [SpendingLimitFields.resetTime]: '10080',
    }),
    defaultSetup.decorator,
  ],
}

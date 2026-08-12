import type { Meta, StoryObj, Decorator } from '@storybook/react'
import type { ReactElement } from 'react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../types'
import CreateSpendingLimit from './index'

// The component reads the current Safe, chain, and token balances from app
// context, so it needs the mock harness. The `efSafe` scenario supplies a rich
// balances fixture, which populates the token amount selector. It also reads
// `data` (prefilled form values) and `onNext` from TxFlowContext, so we wrap it
// in a matching provider decorator.
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/balances/settings',
  shadcn: true,
})

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
  return <TxFlowContext.Provider value={value}>{children}</TxFlowContext.Provider>
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

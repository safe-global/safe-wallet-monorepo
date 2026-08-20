import type { Meta, StoryObj, Decorator } from '@storybook/react'
import type { ReactElement } from 'react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { SetUpNestedSafe, type SetupNestedSafeForm } from './SetupNestedSafe'

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

// `efSafe` supplies the balances fixture that populates each row's token selector.
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/home',
  shadcn: true,
})

const TxFlowContextWrapper = ({
  data,
  children,
}: {
  data?: SetupNestedSafeForm
  children: ReactElement
}): ReactElement => {
  const value: TxFlowContextType<SetupNestedSafeForm> = {
    ...initialContext,
    data,
    onNext: () => {},
  }
  return <TxFlowContext.Provider value={value}>{children}</TxFlowContext.Provider>
}

const withTxFlowContext = (data?: SetupNestedSafeForm): Decorator => {
  const decorator: Decorator = (Story) => <TxFlowContextWrapper data={data}>{Story()}</TxFlowContextWrapper>
  return decorator
}

const meta = {
  title: 'Components/TxFlow/SetupNestedSafe',
  component: SetUpNestedSafe,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
} satisfies Meta<typeof SetUpNestedSafe>

export default meta

type Story = StoryObj<typeof meta>

/** No assets selected yet — only the name field and the "Fund new asset" button. */
export const Empty: Story = {
  decorators: [withTxFlowContext({ name: '', assets: [] }), defaultSetup.decorator],
}

/** One funded asset. The amount row is the shared `TokenAmountInput`, as used by the Send flow. */
export const OneAsset: Story = {
  decorators: [
    withTxFlowContext({ name: '', assets: [{ tokenAddress: ZERO_ADDRESS, amount: '0.5' }] }),
    defaultSetup.decorator,
  ],
}

/** Two funded assets. Each row excludes the token already picked by the other. */
export const MultipleAssets: Story = {
  decorators: [
    withTxFlowContext({
      name: 'Treasury',
      assets: [
        { tokenAddress: ZERO_ADDRESS, amount: '0.5' },
        { tokenAddress: USDC_ADDRESS, amount: '250' },
      ],
    }),
    defaultSetup.decorator,
  ],
}

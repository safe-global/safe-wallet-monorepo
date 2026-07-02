import type { Meta, StoryObj } from '@storybook/react'
import type { ReactElement } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { mswLoader } from 'msw-storybook-addon'
import { parseUnits } from 'ethers'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { SpendingLimitState } from '@/features/spending-limits'
import { createMockStory } from '@/stories/mocks'
import { MultiTransfersFields, TokenTransferType } from '@/components/tx-flow/flows/TokenTransfer'
import SpendingLimitRow from './index'

// First owner of the `efSafe` fixture — this is the address the `owner` wallet
// preset connects with, so it must match the spending-limit beneficiary for the
// spending-limit radio option to render.
const OWNER_ADDRESS = '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F'
const OTHER_ADDRESS = '0x1234567890123456789012345678901234567890'

const DAI: Balance['tokenInfo'] = {
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  decimals: 18,
  logoUri: '',
  name: 'Dai Stablecoin',
  symbol: 'DAI',
  type: 'ERC20',
}

const AVAILABLE_AMOUNT = parseUnits('250', DAI.decimals)

const spendingLimit = (beneficiary: string): SpendingLimitState => ({
  beneficiary,
  token: { address: DAI.address, symbol: DAI.symbol, decimals: DAI.decimals },
  amount: parseUnits('500', DAI.decimals).toString(),
  spent: parseUnits('250', DAI.decimals).toString(),
  nonce: '0',
  resetTimeMin: '0',
  lastResetMin: '0',
})

// react-hook-form context is required because the component reads it via useFormContext.
const withForm = (Story: () => ReactElement) => {
  const Wrapper = () => {
    const methods = useForm({ defaultValues: { [MultiTransfersFields.type]: TokenTransferType.multiSig } })
    return <FormProvider {...methods}>{Story()}</FormProvider>
  }
  return <Wrapper />
}

const meta = {
  title: 'Features/Spending Limits/SpendingLimitRow',
  component: SpendingLimitRow,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SpendingLimitRow>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Wallet is a Safe owner AND a spending-limit beneficiary for the selected token,
 * so both the "Standard transaction" and "Spending limit" options are shown.
 */
export const BothOptions: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    shadcn: true,
    store: {
      spendingLimits: { data: [spendingLimit(OWNER_ADDRESS)], loading: false, loaded: true },
    },
  })
  return {
    args: { availableAmount: AVAILABLE_AMOUNT, selectedToken: DAI },
    parameters: { ...setup.parameters },
    decorators: [withForm, setup.decorator],
  }
})()

/**
 * Owner wallet with no spending limit for the selected token — only the
 * "Standard transaction" option renders.
 */
export const StandardOnly: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    shadcn: true,
    store: {
      spendingLimits: { data: [], loading: false, loaded: true },
    },
  })
  return {
    args: { availableAmount: AVAILABLE_AMOUNT, selectedToken: DAI },
    parameters: { ...setup.parameters },
    decorators: [withForm, setup.decorator],
  }
})()

/**
 * Wallet is a spending-limit beneficiary but not an owner/proposer, so it cannot
 * create standard transactions — only the "Spending limit" option renders.
 */
export const SpendingLimitOnly: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: {
      connectedWallet: {
        address: OTHER_ADDRESS,
        chainId: '1',
        label: 'MetaMask',
        provider: null as never,
        balance: '1.0',
      },
      signer: { address: OTHER_ADDRESS, chainId: '1', provider: null },
      setSignerAddress: () => {},
      isReady: true,
    },
    shadcn: true,
    store: {
      spendingLimits: { data: [spendingLimit(OTHER_ADDRESS)], loading: false, loaded: true },
    },
  })
  return {
    args: { availableAmount: AVAILABLE_AMOUNT, selectedToken: DAI },
    parameters: { ...setup.parameters },
    decorators: [withForm, setup.decorator],
  }
})()

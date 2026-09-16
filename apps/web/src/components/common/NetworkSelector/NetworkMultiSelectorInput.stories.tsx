import type { Meta, StoryObj } from '@storybook/react'
import type { ReactElement, ReactNode } from 'react'
import { mswLoader } from 'msw-storybook-addon'
import { FormProvider, useForm } from 'react-hook-form'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { createMockStory } from '@/stories/mocks'
import NetworkMultiSelectorInput from './NetworkMultiSelectorInput'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/new-safe/create',
  shadcn: true,
})

const chain = (chainId: string, chainName: string) => ({ chainId, chainName }) as Chain

const FormWrapper = ({ children }: { children: ReactNode }): ReactElement => {
  const methods = useForm({ defaultValues: { networks: [] } })
  return <FormProvider {...methods}>{children}</FormProvider>
}

const meta = {
  title: 'Components/NetworkSelector/NetworkMultiSelectorInput',
  component: NetworkMultiSelectorInput,
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <FormWrapper>
        <Story />
      </FormWrapper>
    ),
    defaultSetup.decorator,
  ],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
  args: { name: 'networks', value: [] },
} satisfies Meta<typeof NetworkMultiSelectorInput>

export default meta

type Story = StoryObj<typeof meta>

/** Nothing selected — the control rests at the hero height with just its placeholder. */
export const Empty: Story = {}

/** One selected network. */
export const WithSelection: Story = {
  args: { value: [chain('11155111', 'Sepolia')] },
}

/** Enough chips to wrap onto a second line — the control grows instead of clipping them. */
export const Wrapping: Story = {
  args: {
    value: [
      chain('1', 'Ethereum'),
      chain('137', 'Polygon'),
      chain('11155111', 'Sepolia'),
      chain('100', 'Gnosis Chain'),
      chain('42161', 'Arbitrum One'),
      chain('10', 'OP Mainnet'),
    ],
  },
}

/** Invalid state — InputGroup draws the destructive border from the control's aria-invalid. */
export const Invalid: Story = {
  args: { value: [], error: true, helperText: 'Select at least one network' },
}

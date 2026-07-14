import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { createMockStory } from '@/stories/mocks'
import PayNowPayLater from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  shadcn: true,
})

const StatefulPayNowPayLater = (props: Omit<Parameters<typeof PayNowPayLater>[0], 'payMethod' | 'setPayMethod'>) => {
  const [payMethod, setPayMethod] = useState<PayMethod>(PayMethod.PayNow)

  return <PayNowPayLater {...props} payMethod={payMethod} setPayMethod={setPayMethod} />
}

const meta = {
  title: 'Features/Counterfactual/PayNowPayLater',
  component: StatefulPayNowPayLater,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof StatefulPayNowPayLater>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    totalFee: '0.0051',
    canRelay: false,
    isMultiChain: false,
    isUserAuthenticated: true,
  },
}

export const Sponsored: Story = {
  args: {
    totalFee: '0.0051',
    canRelay: true,
    isMultiChain: false,
    isUserAuthenticated: true,
  },
}

export const MultiChain: Story = {
  args: {
    totalFee: '0.0051',
    canRelay: false,
    isMultiChain: true,
    isUserAuthenticated: true,
  },
}

export const NotAuthenticated: Story = {
  args: {
    totalFee: '0.0051',
    canRelay: false,
    isMultiChain: false,
    isUserAuthenticated: false,
  },
}

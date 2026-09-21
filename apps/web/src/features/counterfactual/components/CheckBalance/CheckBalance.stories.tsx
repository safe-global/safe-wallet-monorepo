import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import { PendingSafeStatus } from '@safe-global/utils/features/counterfactual/store/types'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'
import { createMockStory } from '@/stories/mocks'
import { SAFE_ADDRESSES } from '../../../../../../../config/test/msw/fixtures'
import CheckBalance from './index'

const undeployedSafes: UndeployedSafesState = {
  '1': {
    [SAFE_ADDRESSES.efSafe.address]: {
      props: {
        factoryAddress: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
        masterCopy: '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762',
        safeAccountConfig: {
          threshold: 1,
          owners: ['0x8b2f79E2A9e9C61c71E5EE9152dEA9A05b23e340'],
          fallbackHandler: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
          to: '0x0000000000000000000000000000000000000000',
          data: '0x',
          paymentReceiver: '0x0000000000000000000000000000000000000000',
        },
        saltNonce: '0',
        safeVersion: '1.4.1',
      },
      status: {
        status: PendingSafeStatus.AWAITING_EXECUTION,
        type: PayMethod.PayLater,
      },
      isCreator: true,
    },
  },
}

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
  store: {
    safeInfo: {
      data: { deployed: false },
    },
    undeployedSafes,
  },
})

const meta = {
  title: 'Features/Counterfactual/CheckBalance',
  component: CheckBalance,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof CheckBalance>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

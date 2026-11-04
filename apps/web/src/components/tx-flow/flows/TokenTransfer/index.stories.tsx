import type { Meta, StoryObj } from '@storybook/react'
import { TokenType } from '@safe-global/store/gateway/types'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { createMockStory, getFixtureData } from '@/stories/mocks'
import TokenTransferFlow from './index'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true })

const RECIPIENT = '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC'

const { balancesData } = getFixtureData('efSafe')
const ether = balancesData.items.find(({ tokenInfo }) => tokenInfo.type === TokenType.NATIVE_TOKEN)

const meta = {
  title: 'Components/TxFlow/TokenTransfer',
  component: TokenTransferFlow,
  decorators: [setup.decorator],
  parameters: { layout: 'fullscreen', ...setup.parameters },
} satisfies Meta<typeof TokenTransferFlow>

export default meta
type Story = StoryObj<typeof meta>

export const FilledWithMaxEther: Story = {
  args: {
    recipients: [
      {
        recipient: RECIPIENT,
        tokenAddress: ZERO_ADDRESS,
        amount: ether ? safeFormatUnits(ether.balance, ether.tokenInfo.decimals) : '',
      },
    ],
  },
}

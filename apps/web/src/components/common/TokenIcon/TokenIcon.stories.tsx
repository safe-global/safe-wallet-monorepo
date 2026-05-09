import type { Meta, StoryObj } from '@storybook/react'
import TokenIcon from './index'
import { StoreDecorator } from '@/stories/storeDecorator'

const meta = {
  component: TokenIcon,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <Story />
      </StoreDecorator>
    ),
  ],
  // Skip visual regression tests until baseline snapshots are generated
  tags: ['autodocs', '!test'],
} satisfies Meta<typeof TokenIcon>

export default meta
type Story = StoryObj<typeof meta>

const ETH_LOGO = 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
const USDC_LOGO = 'https://assets.coingecko.com/coins/images/6319/small/usdc.png'

export const Default: Story = {
  args: {
    logoUri: ETH_LOGO,
    tokenSymbol: 'ETH',
  },
}

export const SmallSize: Story = {
  args: {
    logoUri: ETH_LOGO,
    tokenSymbol: 'ETH',
    size: 16,
  },
}

export const LargeSize: Story = {
  args: {
    logoUri: ETH_LOGO,
    tokenSymbol: 'ETH',
    size: 48,
  },
}

export const WithChainIndicator: Story = {
  args: {
    logoUri: USDC_LOGO,
    tokenSymbol: 'USDC',
    chainId: '1',
  },
}

export const NoRadius: Story = {
  args: {
    logoUri: ETH_LOGO,
    tokenSymbol: 'ETH',
    noRadius: true,
  },
}

export const Fallback: Story = {
  args: {
    tokenSymbol: 'UNKNOWN',
  },
}

export const CustomFallback: Story = {
  args: {
    tokenSymbol: 'CUSTOM',
    fallbackSrc: 'https://via.placeholder.com/26',
  },
}

import { AccountItem } from './AccountItem'
import { Meta, StoryObj } from '@storybook/react'
import { mockedActiveSafeInfo, mockedChains } from '@/src/store/constants'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { action } from '@storybook/addon-actions'
import { Address } from '@/src/types/address'

const meta: Meta<typeof AccountItem> = {
  title: 'Assets/AccountItem',
  component: AccountItem,
  argTypes: {},
}

export default meta

type Story = StoryObj<typeof AccountItem>

export const Default: Story = {
  args: {
    account: mockedActiveSafeInfo,
    chains: mockedChains as unknown as Chain[],
    activeAccount: '0x123',
    onSelect: action('onSelect'),
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export const ActiveAccount: Story = {
  args: {
    account: mockedActiveSafeInfo,
    chains: mockedChains as unknown as Chain[],
    activeAccount: mockedActiveSafeInfo.address.value as Address,
    onSelect: action('onSelect'),
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export const TruncatedAccountChains: Story = {
  args: {
    account: mockedActiveSafeInfo,
    chains: [...mockedChains, ...mockedChains, ...mockedChains] as unknown as Chain[],
    activeAccount: '0x12312',
    onSelect: action('onSelect'),
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export const TruncatedActiveAccountChains: Story = {
  args: {
    account: mockedActiveSafeInfo,
    chains: [...mockedChains, ...mockedChains, ...mockedChains] as unknown as Chain[],
    activeAccount: mockedActiveSafeInfo.address.value as Address,
    onSelect: action('onSelect'),
  },
  parameters: {
    layout: 'fullscreen',
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { ChainIndicator } from './ChainIndicator'
import { View } from 'tamagui'

const meta: Meta<typeof ChainIndicator> = {
  title: 'Components/ChainIndicator',
  component: ChainIndicator,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    chainId: {
      control: 'text',
    },
    showUnknown: {
      control: 'boolean',
    },
    showLogo: {
      control: 'boolean',
    },
    onlyLogo: {
      control: 'boolean',
    },
    fiatValue: {
      control: 'text',
    },
    currency: {
      control: 'text',
    },
    imageSize: {
      control: 'text',
    },
  },
}

export default meta
type Story = StoryObj<typeof ChainIndicator>

export const Default: Story = {
  args: {
    chainId: '1',
  },
}

export const WithFiatValue: Story = {
  args: {
    chainId: '1',
    fiatValue: '1234.56',
    currency: 'USD',
  },
}

export const OnlyLogo: Story = {
  args: {
    chainId: '137',
    onlyLogo: true,
  },
}

export const UnknownChain: Story = {
  args: {
    chainId: '999999',
    showUnknown: true,
  },
}

export const NoLogo: Story = {
  args: {
    chainId: '1',
    showLogo: false,
  },
}

export const Multiple: Story = {
  render: () => (
    <View gap="$4" padding="$4">
      <ChainIndicator chainId="1" showLogo={true} />
      <ChainIndicator chainId="137" showLogo={true} fiatValue="5678.90" currency="EUR" />
      <ChainIndicator chainId="1" onlyLogo={true} />
      <ChainIndicator chainId="999999" showUnknown={true} />
    </View>
  ),
}

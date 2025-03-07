import type { StoryObj, Meta } from '@storybook/react'
import { NetworkBadge } from '@/src/components/NetworkBadge/NetworkBadge'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { XStack, YStack } from 'tamagui'

const meta: Meta<typeof NetworkBadge> = {
  title: 'NetworkBadge',
  component: NetworkBadge,
  args: {
    network: {
      chainName: 'Ethereum',
      chainLogoUri: 'https://example.com/ethereum-logo.png',
    } as Chain,
  },
}

export default meta

type Story = StoryObj<typeof NetworkBadge>

export const Default: Story = {
  args: {
    network: {
      chainName: 'Ethereum',
      chainLogoUri: 'https://example.com/ethereum-logo.png',
    } as Chain,
  },
}

export const Multiple: Story = {
  args: {
    network: {
      chainName: 'Ethereum',
      chainLogoUri: 'https://example.com/ethereum-logo.png',
    } as Chain,
  },
  render: (args) => (
    <YStack>
      <XStack gap={'$2'}>
        <NetworkBadge {...args} />
        <NetworkBadge {...args} />
        <NetworkBadge {...args} />
      </XStack>
    </YStack>
  ),
}

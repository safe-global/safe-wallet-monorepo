import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { SessionTypes } from '@walletconnect/types'
import { createMockStory } from '@/stories/mocks'
import WcSessionList from './index'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

const createSession = (topic: string, name: string, url: string, icon: string): SessionTypes.Struct => ({
  topic,
  pairingTopic: `pairing-${topic}`,
  relay: { protocol: 'irn' },
  expiry: Math.floor(Date.now() / 1000) + 86_400,
  acknowledged: true,
  controller: 'controller',
  namespaces: {
    eip155: {
      chains: ['eip155:1'],
      accounts: ['eip155:1:0x0000000000000000000000000000000000000001'],
      methods: ['eth_sendTransaction', 'personal_sign'],
      events: ['chainChanged', 'accountsChanged'],
    },
  },
  requiredNamespaces: {
    eip155: {
      chains: ['eip155:1'],
      methods: ['eth_sendTransaction', 'personal_sign'],
      events: ['chainChanged', 'accountsChanged'],
    },
  },
  optionalNamespaces: {},
  self: {
    publicKey: 'self-public-key',
    metadata: {
      name: 'Safe{Wallet}',
      description: 'Smart contract wallet for Ethereum',
      url: 'https://app.safe.global',
      icons: [],
    },
  },
  peer: {
    publicKey: `peer-public-key-${topic}`,
    metadata: {
      name,
      description: `${name} dApp`,
      url,
      icons: [icon],
    },
  },
})

const sessions: SessionTypes.Struct[] = [
  createSession('session-1', 'Uniswap Interface', 'https://app.uniswap.org', 'https://app.uniswap.org/favicon.png'),
  createSession('session-2', 'CoW Swap', 'https://swap.cow.fi', 'https://swap.cow.fi/favicon.png'),
  createSession(
    'session-3',
    'A dApp with a very long name that gets truncated',
    'https://example.org',
    'https://example.org/favicon.ico',
  ),
]

const meta = {
  title: 'Features/WalletConnect/WcSessionList',
  component: WcSessionList,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof WcSessionList>

export default meta

type Story = StoryObj<typeof meta>

export const ActiveSessions: Story = {
  args: {
    sessions,
  },
}

export const NoSessions: Story = {
  args: {
    sessions: [],
  },
}

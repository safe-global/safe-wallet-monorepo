import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { useEffect, useState, type ComponentProps } from 'react'
import { fn } from 'storybook/test'
import type { Eip1193Provider } from 'ethers'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { createMockStory } from '@/stories/mocks'
import WalletPopover from './index'

// The mock harness resolves the current Safe to the efSafe fixture, which lives on Ethereum
// mainnet (chainId '1'). Keeping the wallet on the same chain lets `useChain` resolve a real
// chain config so the balance renders without the "(other chain)" suffix.
const CHAIN_ID = '1'

// A `provider` is required by the ConnectedWallet type but WalletPopover only reads it inside the
// switch/disconnect handlers (which route through onboard). Rendering never touches it.
const stubProvider = {} as Eip1193Provider

const metaMaskWallet: ConnectedWallet = {
  label: 'MetaMask',
  chainId: CHAIN_ID,
  address: '0x1234567890AbcdEF1234567890aBcdef12345678',
  provider: stubProvider,
  balance: '12.345 ETH',
}

const walletConnectWallet: ConnectedWallet = {
  label: 'WalletConnect',
  chainId: CHAIN_ID,
  address: '0xfEC2c4B15b56d7c15d6d0F3c2c8c4e6D8dAB1234',
  ens: 'alice.eth',
  provider: stubProvider,
  balance: '0.42 ETH',
}

/**
 * WalletPopover is an anchored, controlled popover: it opens when `open` is true and pins itself to
 * a real DOM element passed as `anchorEl`. This harness mounts a hidden anchor element and forces the
 * popover open so the content is visible in isolation.
 */
const PopoverHarness = (props: Omit<ComponentProps<typeof WalletPopover>, 'anchorEl' | 'open'>) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  useEffect(() => {
    const el = document.createElement('button')
    el.style.position = 'fixed'
    el.style.top = '24px'
    el.style.left = '24px'
    document.body.appendChild(el)
    setAnchorEl(el)
    return () => {
      el.remove()
    }
  }, [])

  return <WalletPopover {...props} anchorEl={anchorEl} open={anchorEl !== null} />
}

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

const meta = {
  title: 'Features/Wallet/WalletPopover',
  component: WalletPopover,
  render: (args) => <PopoverHarness {...args} />,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
  },
  args: {
    // The harness supplies its own mounted anchor and forces `open`; these satisfy the required props.
    open: true,
    anchorEl: null,
    onClose: fn(),
    onWalletSwitch: fn(),
    onWalletDisconnect: fn(),
  },
} satisfies Meta<typeof WalletPopover>

export default meta

type Story = StoryObj<typeof meta>

/** Default connected wallet (MetaMask) showing the address, wallet label, balance and actions. */
export const Default: Story = {
  args: {
    wallet: metaMaskWallet,
  },
}

/** A WalletConnect session with a resolved ENS name used as the display label. */
export const WalletConnect: Story = {
  args: {
    wallet: walletConnectWallet,
  },
}

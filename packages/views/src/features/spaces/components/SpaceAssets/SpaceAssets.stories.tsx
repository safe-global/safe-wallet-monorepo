import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import ChainAssetsSection from './ChainAssetsSection'
import SafeAssetsBand from './SafeAssetsBand'
import SpaceAssetsToolbar from './SpaceAssetsToolbar'
import SpaceAssetsTotals from './SpaceAssetsTotals'
import { SpaceAssetsEmpty, SpaceAssetsLoadError, SpaceAssetsNoMatches } from './SpaceAssetsStates'
import type { AssetProtocolRow, AssetTokenRow } from './types'

const SAFE_ADDRESS = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const ETHEREUM = { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }
const GNOSIS = { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: null, shortName: 'gno' }

const TOKENS: AssetTokenRow[] = [
  { id: 'eth', name: 'Ether', symbol: 'ETH', amount: '12.5', value: '$ 41,250' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', amount: '18,400', value: '$ 18,400' },
  { id: 'safe', name: 'Safe Token', symbol: 'SAFE', amount: '50,000', value: '$ 9,500' },
]

const PROTOCOLS: AssetProtocolRow[] = [
  {
    id: 'lending',
    name: 'Lending protocol',
    value: '$ 25,000',
    positions: [{ id: 'supplied', name: 'USD Coin', type: 'Deposited', amount: '25,000 USDC', value: '$ 25,000' }],
  },
  {
    id: 'staking',
    name: 'Staking protocol',
    value: '$ 6,600',
    positions: [
      { id: 'staked', name: 'Ether', type: 'Staked', amount: '2 ETH', value: '$ 6,600' },
      { id: 'reward', name: 'Ether', type: 'Reward', amount: '0.01 ETH', value: '$ 33' },
    ],
  },
]

const meta = {
  title: 'Features/Spaces/Assets/Views',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** A Safe on two networks: tokens and positions on Ethereum, tokens only on Gnosis Chain */
export const SafeWithAssets: Story = {
  render: () => (
    <SafeAssetsBand
      address={SAFE_ADDRESS}
      name="Treasury"
      chains={[ETHEREUM, GNOSIS]}
      total="$ 109,150"
      collapsed={false}
      onToggle={fn()}
    >
      <ChainAssetsSection
        chain={ETHEREUM}
        state="ready"
        total="$ 100,750"
        tokens={TOKENS}
        protocols={PROTOCOLS}
        onRetry={fn()}
      />
      <ChainAssetsSection
        chain={GNOSIS}
        state="ready"
        total="$ 8,400"
        tokens={[{ id: 'xdai', name: 'xDAI', symbol: 'XDAI', amount: '8,400', value: '$ 8,400' }]}
        onRetry={fn()}
      />
    </SafeAssetsBand>
  ),
}

export const SafeCollapsed: Story = {
  render: () => (
    <SafeAssetsBand
      address={SAFE_ADDRESS}
      name="Treasury"
      chains={[ETHEREUM, GNOSIS]}
      total="$ 109,150"
      collapsed
      onToggle={fn()}
    >
      {null}
    </SafeAssetsBand>
  ),
}

/** One network per state: loading, failed, not activated, empty, unsupported and positions failed */
export const NetworkStates: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <SafeAssetsBand
      address={SAFE_ADDRESS}
      name="Operations"
      chains={[ETHEREUM, GNOSIS]}
      collapsed={false}
      onToggle={fn()}
    >
      <ChainAssetsSection chain={ETHEREUM} state="loading" tokens={[]} onRetry={fn()} />
      <ChainAssetsSection chain={GNOSIS} state="error" tokens={[]} onRetry={fn()} />
      <ChainAssetsSection chain={ETHEREUM} state="inactive" tokens={[]} onRetry={fn()} />
      <ChainAssetsSection chain={GNOSIS} state="ready" total="$ 0" tokens={[]} protocols={[]} onRetry={fn()} />
      <ChainAssetsSection chain={ETHEREUM} state="unsupported" tokens={[]} onRetry={fn()} />
      <ChainAssetsSection
        chain={GNOSIS}
        state="ready"
        total="$ 8,400"
        tokens={TOKENS.slice(0, 1)}
        positionsFailed
        onRetry={fn()}
      />
    </SafeAssetsBand>
  ),
}

export const Totals: Story = {
  render: () => (
    <SpaceAssetsTotals total="$ 140,750" tokens="$ 109,150" positions="$ 31,600" isLoading={false} isPartial={false} />
  ),
}

/** Some networks failed, so the totals say they leave them out */
export const TotalsPartial: Story = {
  render: () => (
    <SpaceAssetsTotals total="$ 100,750" tokens="$ 69,150" positions="$ 31,600" isLoading={false} isPartial />
  ),
}

/** Always skeletons: the totals wait for every shown network */
export const TotalsLoading: Story = {
  tags: ['skip-visual-test'],
  render: () => <SpaceAssetsTotals total="" tokens="" positions="" isLoading isPartial={false} />,
}

export const ToolbarWithFilters: Story = {
  render: () => (
    <SpaceAssetsToolbar
      safe={{
        options: [{ safeAddress: SAFE_ADDRESS, name: 'Treasury', count: 2, checked: true }],
        note: 'Sorted as in your Safe accounts',
        onToggle: fn(),
      }}
      network={{
        options: [
          { chainId: '1', name: 'Ethereum', count: 1, checked: false },
          { chainId: '100', name: 'Gnosis Chain', count: 1, checked: true },
        ],
        onToggle: fn(),
      }}
      chips={{ safes: [{ safeAddress: SAFE_ADDRESS, name: 'Treasury' }], networkNames: ['Gnosis Chain'] }}
      onRemove={fn()}
      onClear={fn()}
    />
  ),
}

export const Empty: Story = {
  render: () => <SpaceAssetsEmpty />,
}

export const NoMatches: Story = {
  render: () => <SpaceAssetsNoMatches onClear={fn()} />,
}

export const LoadError: Story = {
  render: () => <SpaceAssetsLoadError onRetry={fn()} />,
}

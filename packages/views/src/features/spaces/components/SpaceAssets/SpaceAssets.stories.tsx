import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import SafeBandRow from '@safe-global/views/features/spaces/components/SpaceQueue/SafeBandRow'
import SafeBandTitle, { SafeBandCard } from '@safe-global/views/features/spaces/components/SpaceQueue/SafeBandTitle'
import ChainAssetsRows from './ChainAssetsRows'
import { ASSETS_COLUMNS } from './columns'
import SpaceAssetsTable from './SpaceAssetsTable'
import SpaceAssetsToolbar from './SpaceAssetsToolbar'
import SpaceAssetsTotals from './SpaceAssetsTotals'
import { SpaceAssetsEmpty, SpaceAssetsLoadError, SpaceAssetsNoMatches } from './SpaceAssetsStates'
import type { AssetPositionRow, AssetTokenRow } from './types'

const SAFE_ADDRESS = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const OTHER_SAFE_ADDRESS = '0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01'
const ETHEREUM = { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }
const GNOSIS = { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: null, shortName: 'gno' }

const TOKENS: AssetTokenRow[] = [
  { id: 'eth', name: 'Ether', symbol: 'ETH', amount: '12.5', value: '$ 41,250' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', amount: '18,400', value: '$ 18,400' },
  { id: 'safe', name: 'Safe Token', symbol: 'SAFE', amount: '50,000', value: '$ 9,500' },
]

const POSITIONS: AssetPositionRow[] = [
  {
    id: 'supplied',
    name: 'USD Coin',
    protocol: 'Lending protocol',
    type: 'Deposited',
    amount: '25,000 USDC',
    value: '$ 25,000',
  },
  { id: 'staked', name: 'Ether', protocol: 'Staking protocol', type: 'Staked', amount: '2 ETH', value: '$ 6,600' },
  { id: 'reward', name: 'Ether', protocol: 'Staking protocol', type: 'Reward', amount: '0.01 ETH', value: '$ 33' },
]

const Band = ({
  address,
  name,
  total,
  collapsed = false,
}: {
  address: string
  name: string
  total: string
  collapsed?: boolean
}) => (
  <SafeBandRow
    safeAddress={address}
    title={
      <SafeBandTitle
        safeAddress={address}
        name={name}
        card={
          <SafeBandCard
            name={name}
            address={address}
            details={[{ label: 'Networks', value: 'Ethereum, Gnosis Chain' }]}
          />
        }
        chains={[ETHEREUM, GNOSIS].map((chain) => ({ chain, collapsed, label: `Collapse ${name}`, onClick: fn() }))}
      />
    }
    collapsed={collapsed}
    summary={total}
    showSummary="always"
    onToggle={fn()}
    columnCount={ASSETS_COLUMNS.length}
  />
)

const meta = {
  title: 'Features/Spaces/Assets/Views',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Two Safes: Treasury with tokens and positions on Ethereum and tokens on Gnosis Chain, Operations collapsed */
export const Table: Story = {
  render: () => (
    <SpaceAssetsTable collapseAll={{ allCollapsed: false, count: 2, onToggle: fn() }}>
      <Band address={SAFE_ADDRESS} name="Treasury" total="$ 109,183" />
      <ChainAssetsRows
        chain={ETHEREUM}
        state="ready"
        total="$ 100,783"
        tokens={TOKENS}
        positions={POSITIONS}
        collapsed={false}
        onToggle={fn()}
        onRetry={fn()}
      />
      <ChainAssetsRows
        chain={GNOSIS}
        state="ready"
        total="$ 8,400"
        tokens={[{ id: 'xdai', name: 'xDAI', symbol: 'XDAI', amount: '8,400', value: '$ 8,400' }]}
        positions={[]}
        collapsed={false}
        onToggle={fn()}
        onRetry={fn()}
      />
      <Band address={OTHER_SAFE_ADDRESS} name="Operations" total="$ 12,000" collapsed />
    </SpaceAssetsTable>
  ),
}

/** One network per state: loading, failed, not activated, unsupported, empty and positions failed */
export const NetworkStates: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <SpaceAssetsTable>
      <Band address={SAFE_ADDRESS} name="Operations" total="" />
      <ChainAssetsRows
        chain={ETHEREUM}
        state="loading"
        tokens={[]}
        positions={[]}
        collapsed={false}
        onToggle={fn()}
        onRetry={fn()}
      />
      <ChainAssetsRows
        chain={GNOSIS}
        state="error"
        tokens={[]}
        positions={[]}
        collapsed={false}
        onToggle={fn()}
        onRetry={fn()}
      />
      <ChainAssetsRows
        chain={ETHEREUM}
        state="inactive"
        tokens={[]}
        positions={[]}
        collapsed={false}
        onToggle={fn()}
        onRetry={fn()}
      />
      <ChainAssetsRows
        chain={GNOSIS}
        state="unsupported"
        tokens={[]}
        positions={[]}
        collapsed={false}
        onToggle={fn()}
        onRetry={fn()}
      />
      <ChainAssetsRows
        chain={ETHEREUM}
        state="ready"
        total="$ 0"
        tokens={[]}
        positions={[]}
        collapsed={false}
        onToggle={fn()}
        onRetry={fn()}
      />
      <ChainAssetsRows
        chain={GNOSIS}
        state="ready"
        total="$ 41,250"
        tokens={TOKENS.slice(0, 1)}
        positions={[]}
        positionsFailed
        collapsed={false}
        onToggle={fn()}
        onRetry={fn()}
      />
    </SpaceAssetsTable>
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

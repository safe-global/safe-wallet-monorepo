import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import Identicon from '@safe-global/views/components/common/Identicon'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import AssetLogo from './AssetLogo'
import { AssetHoldingRow, AssetsGroupRow, AssetsNoteRow } from './AssetsRows'
import SpaceAssetsTable from './SpaceAssetsTable'
import SpaceAssetsToolbar from './SpaceAssetsToolbar'
import SpaceAssetsTotals from './SpaceAssetsTotals'
import { SpaceAssetsEmpty, SpaceAssetsLoadError, SpaceAssetsNoMatches } from './SpaceAssetsStates'

const TREASURY = '0x8675B754342754A30A2AeF474D114d8460bca19b'
const OPERATIONS = '0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01'
const ETHEREUM = { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }
const GNOSIS = { chainId: '100', chainName: 'Gnosis Chain', chainLogoUri: null, shortName: 'gno' }
const BASE = { chainId: '8453', chainName: 'Base', chainLogoUri: null, shortName: 'base' }

const meta = {
  title: 'Features/Spaces/Assets/Views',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The default view, grouped by type: tokens, then positions, each asset summed across Safes and networks */
export const GroupedByType: Story = {
  render: () => (
    <SpaceAssetsTable firstColumn="Asset" collapseAll={{ allCollapsed: false, count: 2, onToggle: fn() }}>
      <AssetsGroupRow
        logo={<AssetLogo label="T" />}
        title="Tokens"
        chains={[ETHEREUM, GNOSIS, BASE]}
        value="$ 19,000"
        collapsed={false}
        onToggle={fn()}
      />
      <AssetHoldingRow
        logo={<AssetLogo label="SAFE" />}
        title="Safe Token"
        subtitle="SAFE · Ethereum"
        type="Token"
        balance="50,000 SAFE"
        value="$ 9,500"
      />
      <AssetHoldingRow
        logo={<AssetLogo label="USDC" />}
        title="USD Coin"
        subtitle="USDC · 2 networks"
        type="Token"
        balance="4,500 USDC"
        value="$ 4,500"
      />
      <AssetHoldingRow
        logo={<AssetLogo label="ETH" />}
        title="Ether"
        subtitle="ETH · 3 networks"
        type="Token"
        balance="3.5 ETH"
        value="$ 3,818"
      />
      <AssetsGroupRow
        logo={<AssetLogo label="P" />}
        title="Positions"
        chains={[ETHEREUM]}
        value="$ 2,182"
        collapsed={false}
        onToggle={fn()}
      />
      <AssetHoldingRow
        logo={<AssetLogo label="ETH" />}
        title="Ether"
        subtitle="ETH · Staking protocol · Ethereum"
        type="Staked"
        balance="2 ETH"
        value="$ 2,182"
      />
    </SpaceAssetsTable>
  ),
}

/** Grouped by asset: ETH expanded to a row per network summed across its Safes, USDC collapsed to its total */
export const GroupedByAsset: Story = {
  render: () => (
    <SpaceAssetsTable firstColumn="Network" collapseAll={{ allCollapsed: false, count: 3, onToggle: fn() }}>
      <AssetsGroupRow
        logo={<AssetLogo label="ETH" />}
        title="ETH"
        subtitle="Ether"
        chains={[ETHEREUM, GNOSIS, BASE]}
        balance="5.5 ETH"
        value="$ 6,000"
        collapsed={false}
        onToggle={fn()}
      />
      <AssetHoldingRow
        logo={<ChainLogo chain={ETHEREUM} size="md" />}
        title="Ethereum"
        subtitle="5 Safe accounts"
        type="Token"
        balance="3 ETH"
        value="$ 3,272"
      />
      <AssetHoldingRow
        logo={<ChainLogo chain={ETHEREUM} size="md" />}
        title="Ethereum"
        subtitle="Treasury · Staking protocol"
        type="Staked"
        balance="2 ETH"
        value="$ 2,182"
      />
      <AssetHoldingRow
        logo={<ChainLogo chain={BASE} size="md" />}
        title="Base"
        subtitle="Operations"
        type="Token"
        balance="0.5 ETH"
        value="$ 546"
      />
      <AssetsGroupRow
        logo={<AssetLogo label="USDC" />}
        title="USDC"
        subtitle="USD Coin"
        chains={[ETHEREUM, GNOSIS]}
        balance="4,500 USDC"
        value="$ 4,500"
        collapsed
        onToggle={fn()}
      />
    </SpaceAssetsTable>
  ),
}

/** Grouped by Safe, while three more networks load */
export const GroupedBySafeLoading: Story = {
  tags: ['skip-visual-test'],
  render: () => (
    <SpaceAssetsTable firstColumn="Asset">
      <AssetsGroupRow
        logo={<Identicon address={TREASURY} size={32} />}
        title="Treasury"
        subtitle="0x8675…a19b"
        chains={[ETHEREUM, GNOSIS]}
        value="$ 13,772"
        collapsed={false}
        onToggle={fn()}
      />
      <AssetHoldingRow
        logo={<AssetLogo label="SAFE" />}
        title="Safe Token"
        subtitle="SAFE · Ethereum"
        type="Token"
        balance="50,000 SAFE"
        value="$ 9,500"
      />
      <AssetHoldingRow
        logo={<AssetLogo label="USDC" />}
        title="USD Coin"
        subtitle="USDC · Gnosis Chain"
        type="Token"
        balance="4,272 USDC"
        value="$ 4,272"
      />
      <AssetsNoteRow isLoading>Loading the assets of 3 more Safe networks…</AssetsNoteRow>
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
        options: [{ safeAddress: TREASURY, name: 'Treasury', count: 2, checked: true }],
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
      chips={{ safes: [{ safeAddress: TREASURY, name: 'Treasury' }], networkNames: ['Gnosis Chain'] }}
      onRemove={fn()}
      onClear={fn()}
      groupBy={{ value: 'type', onChange: fn() }}
      search={
        <SearchInput
          aria-label="Search assets"
          placeholder="Assets, Safes, networks, protocols…"
          className="min-w-0 flex-1"
        />
      }
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

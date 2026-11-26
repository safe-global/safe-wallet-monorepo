import type { Meta, StoryObj } from '@storybook/react'
import { Coins, Layers } from 'lucide-react'
import { fn } from 'storybook/test'
import { SearchInput } from '@safe-global/views/components/ui/search-input'
import SignersList from '@safe-global/views/features/spaces/components/SpaceQueue/SignersList'
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

const GroupIcon = ({ positions = false }: { positions?: boolean }) => (
  <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
    {positions ? <Layers className="size-4" /> : <Coins className="size-4" />}
  </span>
)

const ETH_OWNERS = (
  <SignersList
    header="Held by 2 Safe accounts"
    isLoading={false}
    hideStatus
    signers={[
      { address: TREASURY, name: 'Treasury · 3 ETH · $ 3,272', signed: true },
      { address: OPERATIONS, name: 'Operations · 0.5 ETH · $ 546', signed: true },
    ]}
  />
)

const meta = {
  title: 'Features/Spaces/Assets/Views',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Tokens, then positions: each asset once, summed across Safes and networks, with the networks holding it */
export const Table: Story = {
  render: () => (
    <SpaceAssetsTable collapseAll={{ allCollapsed: false, count: 2, onToggle: fn() }}>
      <AssetsGroupRow
        logo={<GroupIcon />}
        title="Tokens"
        chains={[ETHEREUM, GNOSIS, BASE]}
        value="$ 17,818"
        collapsed={false}
        onToggle={fn()}
      />
      <AssetHoldingRow
        logo={<AssetLogo label="SAFE" />}
        title="Safe Token"
        subtitle="SAFE"
        chains={[ETHEREUM]}
        balance="50,000 SAFE"
        value="$ 9,500"
      />
      <AssetHoldingRow
        logo={<AssetLogo label="USDC" />}
        title="USD Coin"
        subtitle="USDC"
        chains={[ETHEREUM, GNOSIS]}
        balance="4,500 USDC"
        value="$ 4,500"
      />
      <AssetHoldingRow
        logo={<AssetLogo label="ETH" />}
        title="Ether"
        subtitle="ETH"
        chains={[ETHEREUM, BASE]}
        balance="3.5 ETH"
        value="$ 3,818"
        owners={ETH_OWNERS}
        ownersLabel="Ether: held by 2 Safe accounts"
      />
      <AssetsGroupRow
        logo={<GroupIcon positions />}
        title="Positions"
        chains={[ETHEREUM]}
        value="$ 2,182"
        collapsed={false}
        onToggle={fn()}
      />
      <AssetHoldingRow
        logo={<AssetLogo label="ETH" />}
        title="Ether"
        subtitle="ETH · Staking protocol · Staked"
        chains={[ETHEREUM]}
        balance="2 ETH"
        value="$ 2,182"
      />
      <AssetsNoteRow isLoading>Loading the assets of 3 more Safe networks…</AssetsNoteRow>
    </SpaceAssetsTable>
  ),
}

/** The Safe accounts holding an asset, opened on hovering it: the queue's signers list, without the signed marks */
export const Owners: Story = {
  render: () => <div className="w-72 rounded-md bg-foreground p-3 text-xs text-background">{ETH_OWNERS}</div>,
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

import type { ReactElement } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import AssetLogo from './AssetLogo'
import AssetRow from './AssetRow'
import type { AssetProtocolRow, AssetTokenRow, ChainAssetsState } from './types'

type ChainAssetsSectionProps = {
  chain: ChainInfo
  state: ChainAssetsState
  /** Shown once the assets are loaded */
  total?: string
  tokens: AssetTokenRow[]
  /** Undefined where the network has no positions */
  protocols?: AssetProtocolRow[]
  /** The tokens loaded but the positions didn't */
  positionsFailed?: boolean
  onRetry: () => void
  isRetrying?: boolean
}

const Note = ({ children }: { children: string }) => <p className="py-2 text-sm text-muted-foreground">{children}</p>

const RetryNote = ({ text, onRetry, isRetrying }: { text: string; onRetry: () => void; isRetrying?: boolean }) => (
  <div role="alert" className="flex items-center gap-3 py-2">
    <span className="text-sm text-muted-foreground">{text}</span>
    <Button variant="outline" size="sm" disabled={isRetrying} onClick={onRetry}>
      Try again
    </Button>
  </div>
)

const LoadingRows = () => (
  <div className="flex flex-col gap-3 py-2" aria-busy>
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-2/3" />
  </div>
)

const GroupLabel = ({ children }: { children: string }) => (
  <h4 className="pt-2 text-xs font-medium text-muted-foreground">{children}</h4>
)

const TokenList = ({ tokens }: { tokens: AssetTokenRow[] }) => (
  <ul>
    {tokens.map((token) => (
      <AssetRow
        key={token.id}
        logo={<AssetLogo src={token.logoUri} label={token.symbol} />}
        title={token.name}
        subtitle={token.symbol}
        amount={`${token.amount} ${token.symbol}`}
        value={token.value}
      />
    ))}
  </ul>
)

const ProtocolList = ({ protocols }: { protocols: AssetProtocolRow[] }) => (
  <div className="flex flex-col gap-2">
    {protocols.map((protocol) => (
      <div key={protocol.id} data-testid="space-assets-protocol" className="rounded-lg bg-muted px-3 py-1">
        <AssetRow
          logo={<AssetLogo src={protocol.logoUri} label={protocol.name} />}
          title={protocol.name}
          subtitle={`${protocol.positions.length} ${protocol.positions.length === 1 ? 'position' : 'positions'}`}
          value={protocol.value}
        />
        <ul className="border-t border-border pl-11">
          {protocol.positions.map((position) => (
            <AssetRow
              key={position.id}
              logo={null}
              title={position.name}
              subtitle={position.type}
              amount={position.amount}
              value={position.value}
            />
          ))}
        </ul>
      </div>
    ))}
  </div>
)

const ChainAssetsBody = ({
  state,
  tokens,
  protocols,
  positionsFailed,
  onRetry,
  isRetrying,
}: Omit<ChainAssetsSectionProps, 'chain' | 'total'>): ReactElement => {
  if (state === 'loading') return <LoadingRows />
  if (state === 'inactive') return <Note>This Safe account isn&apos;t activated on this network yet.</Note>
  if (state === 'unsupported') return <Note>Assets on this network can&apos;t be shown.</Note>
  if (state === 'error') {
    return <RetryNote text="Couldn't load the assets on this network." onRetry={onRetry} isRetrying={isRetrying} />
  }

  const positionsNote = positionsFailed && (
    <RetryNote text="Couldn't load the positions on this network." onRetry={onRetry} isRetrying={isRetrying} />
  )
  const hasProtocols = !!protocols && protocols.length > 0
  if (tokens.length === 0 && !hasProtocols) return positionsNote || <Note>No assets</Note>

  return (
    <>
      {tokens.length > 0 && (
        <>
          <GroupLabel>Tokens</GroupLabel>
          <TokenList tokens={tokens} />
        </>
      )}
      {hasProtocols && (
        <>
          <GroupLabel>Positions</GroupLabel>
          <ProtocolList protocols={protocols} />
        </>
      )}
      {positionsNote}
    </>
  )
}

/** One network of a Safe: its tokens, then its positions grouped by protocol */
const ChainAssetsSection = ({ chain, total, ...body }: ChainAssetsSectionProps): ReactElement => (
  <section data-testid="space-assets-chain" aria-label={chain.chainName} className="flex flex-col">
    <header className="flex h-8 items-center gap-2 text-xs">
      <ChainLogo chain={chain} size="sm" />
      <span className="font-medium">{chain.chainName}</span>
      {total && <span className="ml-auto font-medium tabular-nums">{total}</span>}
    </header>
    <ChainAssetsBody {...body} />
  </section>
)

export default ChainAssetsSection

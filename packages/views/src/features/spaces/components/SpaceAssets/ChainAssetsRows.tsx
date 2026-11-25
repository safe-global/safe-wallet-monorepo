import type { ComponentProps, ReactElement, ReactNode } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { TableCell, TableRow } from '@safe-global/views/components/ui/table'
import ChainHeaderRow from '@safe-global/views/features/spaces/components/SpaceQueue/ChainHeaderRow'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import AssetLogo from './AssetLogo'
import { ASSETS_COLUMNS } from './columns'
import type { AssetPositionRow, AssetTokenRow, ChainAssetsState } from './types'

const CHAIN_ROW_PROPS: ComponentProps<'tr'> & { 'data-testid': string } = { 'data-testid': 'space-assets-chain' }

type ChainAssetsRowsProps = {
  chain: ChainInfo
  state: ChainAssetsState
  /** Shown once the assets are loaded */
  total?: string
  tokens: AssetTokenRow[]
  positions: AssetPositionRow[]
  /** The tokens loaded but the positions didn't */
  positionsFailed?: boolean
  collapsed: boolean
  onToggle: () => void
  onRetry: () => void
  isRetrying?: boolean
}

const AssetRow = ({
  logo,
  title,
  subtitle,
  type,
  amount,
  value,
}: {
  logo: ReactNode
  title: string
  subtitle: string
  type: string
  amount: string
  value: string
}) => (
  <TableRow data-testid="space-assets-row">
    <TableCell data-pin="start" />
    <TableCell>
      <span className="flex min-w-0 items-center gap-3">
        {logo}
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">{title}</span>
          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
        </span>
      </span>
    </TableCell>
    <TableCell className="text-muted-foreground">{type}</TableCell>
    <TableCell className="text-right tabular-nums text-muted-foreground">
      <span className="block truncate">{amount}</span>
    </TableCell>
    <TableCell className="text-right font-medium tabular-nums">{value}</TableCell>
  </TableRow>
)

/** A row across the table, past the pinned column, for a network's state */
const NoteRow = ({ children }: { children: ReactNode }) => (
  <TableRow data-no-hover>
    <TableCell data-pin="start" />
    <TableCell colSpan={ASSETS_COLUMNS.length - 1} className="text-sm text-muted-foreground">
      <span className="flex min-h-9 items-center gap-3">{children}</span>
    </TableCell>
  </TableRow>
)

const RetryNote = ({ text, onRetry, isRetrying }: { text: string; onRetry: () => void; isRetrying?: boolean }) => (
  <NoteRow>
    <span role="alert">{text}</span>
    <Button variant="outline" size="xs" disabled={isRetrying} onClick={onRetry}>
      Try again
    </Button>
  </NoteRow>
)

const ChainAssetsBody = ({
  state,
  tokens,
  positions,
  positionsFailed,
  onRetry,
  isRetrying,
}: Omit<ChainAssetsRowsProps, 'chain' | 'total' | 'collapsed' | 'onToggle'>): ReactElement => {
  if (state === 'loading') {
    return (
      <NoteRow>
        <Skeleton className="h-4 w-full" />
      </NoteRow>
    )
  }
  if (state === 'inactive') return <NoteRow>This Safe account isn&apos;t activated on this network yet.</NoteRow>
  if (state === 'unsupported') return <NoteRow>Assets on this network can&apos;t be shown.</NoteRow>
  if (state === 'error') {
    return <RetryNote text="Couldn't load the assets on this network." onRetry={onRetry} isRetrying={isRetrying} />
  }

  return (
    <>
      {tokens.length === 0 && positions.length === 0 && !positionsFailed && <NoteRow>No assets</NoteRow>}
      {tokens.map((token) => (
        <AssetRow
          key={token.id}
          logo={<AssetLogo src={token.logoUri} label={token.symbol} />}
          title={token.name}
          subtitle={token.symbol}
          type="Token"
          amount={`${token.amount} ${token.symbol}`}
          value={token.value}
        />
      ))}
      {positions.map((position) => (
        <AssetRow
          key={position.id}
          logo={<AssetLogo src={position.protocolLogoUri} label={position.protocol} />}
          title={position.name}
          subtitle={position.protocol}
          type={position.type}
          amount={position.amount}
          value={position.value}
        />
      ))}
      {positionsFailed && (
        <RetryNote text="Couldn't load the positions on this network." onRetry={onRetry} isRetrying={isRetrying} />
      )}
    </>
  )
}

/** A network of a Safe: its header with its total, then a row per token and per position */
const ChainAssetsRows = ({ chain, total, collapsed, onToggle, ...body }: ChainAssetsRowsProps): ReactElement => (
  <>
    <ChainHeaderRow
      chain={chain}
      collapsed={collapsed}
      onToggle={onToggle}
      columnCount={ASSETS_COLUMNS.length}
      end={total}
      rowProps={CHAIN_ROW_PROPS}
    />
    {!collapsed && <ChainAssetsBody {...body} />}
  </>
)

export default ChainAssetsRows

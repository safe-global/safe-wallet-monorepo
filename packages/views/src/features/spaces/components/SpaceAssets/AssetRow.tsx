import type { ReactElement, ReactNode } from 'react'

export const ASSET_ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_auto_minmax(5rem,auto)] items-center gap-4'

type AssetRowProps = {
  logo: ReactNode
  title: string
  subtitle: string
  amount?: string
  value: string
}

const AssetRow = ({ logo, title, subtitle, amount, value }: AssetRowProps): ReactElement => (
  <li className={`${ASSET_ROW_GRID} py-2`}>
    <span className="flex min-w-0 items-center gap-3">
      {logo}
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{title}</span>
        <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </span>
    <span className="text-right text-sm tabular-nums text-muted-foreground">{amount}</span>
    <span className="text-right text-sm font-medium tabular-nums">{value}</span>
  </li>
)

export default AssetRow

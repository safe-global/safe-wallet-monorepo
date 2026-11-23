import type { ReactElement } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Button } from '@safe-global/views/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import ChainLogos from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'

export type UnavailableSafeRow = {
  id: string
  name: string
  networkName: string
  chain?: ChainInfo
}

export type UnavailableSafesAlertViewProps = {
  title: string
  maxSafes: number
  isOverLimit: boolean
  rows: UnavailableSafeRow[]
  isRetrying?: boolean
  onRetry: () => void
}

const UnavailableSafesAlertView = ({
  title,
  maxSafes,
  isOverLimit,
  rows,
  isRetrying,
  onRetry,
}: UnavailableSafesAlertViewProps): ReactElement => (
  <Popover>
    <PopoverTrigger render={<Button variant="outline" size="2xs" data-testid="unavailable-safes-alert" />}>
      <TriangleAlert className="text-warning-strong" strokeWidth={ICON_STROKE} aria-hidden />
      {title}
    </PopoverTrigger>
    <PopoverContent align="end" className="w-80 gap-0 p-0">
      <section aria-label={title} className="flex flex-col gap-3 p-4">
        <p className="text-xs text-muted-foreground">
          Their transactions aren&apos;t shown in the table. They may not be deployed on that network yet, or the
          network may be unreachable.
          {isOverLimit &&
            ` The pending queue covers up to ${maxSafes} Safe accounts, so some of these may not be included.`}
        </p>
        <ul className="flex flex-col gap-1.5" aria-label="Safe accounts that couldn't be loaded">
          {rows.map((row) => (
            <li key={row.id} className="flex min-w-0 items-center gap-2 text-sm text-foreground">
              {row.chain && <ChainLogos chains={[row.chain]} size="sm" />}
              <span className="truncate">{row.name}</span>
              <span className="shrink-0 text-muted-foreground">on {row.networkName}</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="border-t border-border p-3">
        <Button variant="outline" size="sm" className="w-full" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? <Spinner className="size-3" aria-hidden /> : <RefreshCw />}
          {rows.length > 1 && !isOverLimit ? `Reload all ${rows.length}` : 'Reload'}
        </Button>
      </div>
    </PopoverContent>
  </Popover>
)

export default UnavailableSafesAlertView

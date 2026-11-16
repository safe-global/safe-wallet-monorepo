import { useState, type ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertSeverityIcon,
  AlertTitle,
} from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
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
}: UnavailableSafesAlertViewProps): ReactElement => {
  const [open, setOpen] = useState(false)
  const toggleLabel = open ? 'Hide Safe accounts' : 'Show Safe accounts'

  return (
    <Alert variant="warning" outlined={false} data-testid="unavailable-safes-alert">
      <AlertSeverityIcon variant="warning" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>
          Their pending transactions aren&apos;t shown.{' '}
          {isOverLimit
            ? `The pending queue covers up to ${maxSafes} Safe accounts, so the others in this Workspace aren't included.`
            : 'They may not be deployed on that network yet, or the network may be unreachable.'}
        </p>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            render={<Button variant="ghost" size="xs" className="-ml-2 mt-1" />}
            aria-label={toggleLabel}
          >
            {toggleLabel}
            <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-1 flex flex-col gap-1.5" aria-label="Safe accounts that couldn't be loaded">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center gap-2 text-sm text-foreground">
                  {row.chain && <ChainLogos chains={[row.chain]} size="sm" />}
                  <span className="truncate">{row.name}</span>
                  <span className="shrink-0 text-muted-foreground">on {row.networkName}</span>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
          Try again
        </Button>
      </AlertAction>
    </Alert>
  )
}

export default UnavailableSafesAlertView

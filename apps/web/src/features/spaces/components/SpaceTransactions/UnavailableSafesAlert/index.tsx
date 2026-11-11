import { useMemo, useState, type ReactElement } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SpaceQueueSafe } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertSeverityIcon,
  AlertTitle,
} from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@safe-global/views/components/ui/collapsible'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import ChainLogo from '../SpaceQueueTable/ChainLogo'

/** The gateway reads the queue of this many distinct Safe addresses at most */
export const SPACE_QUEUE_MAX_SAFES = 100

export const countSafeAddresses = (safes: Record<string, string[]> | undefined): number =>
  new Set(
    Object.values(safes ?? {})
      .flat()
      .map((address) => address.toLowerCase()),
  ).size

export const getUnavailableTitle = (count: number): string =>
  count === 1 ? "1 Safe account couldn't be loaded" : `${count} Safe accounts couldn't be loaded`

type UnavailableSafesAlertProps = {
  spaceId: string
  safes: SpaceQueueSafe[]
  onRetry: () => void
  isRetrying?: boolean
}

const UnavailableSafesAlert = ({ spaceId, safes, onRetry, isRetrying }: UnavailableSafesAlertProps): ReactElement => {
  const [open, setOpen] = useState(false)
  const getName = useSafeNameResolver()
  const { configs } = useChains()
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query({ spaceId })
  const isOverLimit = countSafeAddresses(spaceSafes?.safes) > SPACE_QUEUE_MAX_SAFES

  const rows = useMemo(
    () =>
      safes.map(({ chainId, safeAddress }) => ({
        key: `${chainId}:${safeAddress}`,
        chainId,
        name: getName(safeAddress, chainId) || shortenAddress(safeAddress),
        network: configs.find((chain) => chain.chainId === chainId)?.chainName ?? `Chain ${chainId}`,
      })),
    [safes, getName, configs],
  )

  return (
    <Alert variant="warning" outlined={false} data-testid="unavailable-safes-alert">
      <AlertSeverityIcon variant="warning" />
      <AlertTitle>{getUnavailableTitle(safes.length)}</AlertTitle>
      <AlertDescription>
        <p>
          Their pending transactions aren&apos;t shown.{' '}
          {isOverLimit
            ? `The pending queue covers up to ${SPACE_QUEUE_MAX_SAFES} Safe accounts, so the others in this Workspace aren't included.`
            : 'They may not be deployed on that network yet, or the network may be unreachable.'}
        </p>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            render={<Button variant="ghost" size="xs" className="-ml-2 mt-1" />}
            aria-label={open ? 'Hide Safe accounts' : 'Show Safe accounts'}
          >
            {open ? 'Hide Safe accounts' : 'Show Safe accounts'}
            <ChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-1 flex flex-col gap-1.5" aria-label="Safe accounts that couldn't be loaded">
              {rows.map((row) => (
                <li key={row.key} className="flex items-center gap-2 text-sm text-foreground">
                  <ChainLogo chainId={row.chainId} />
                  <span className="truncate">{row.name}</span>
                  <span className="shrink-0 text-muted-foreground">on {row.network}</span>
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

export default UnavailableSafesAlert

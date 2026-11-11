import { useState } from 'react'
import { CloudOff, Info, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Popover, PopoverContent, PopoverTrigger } from '@safe-global/views/components/ui/popover'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@safe-global/views/components/ui/empty'
import Identicon from '@safe-global/views/components/common/Identicon'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertSeverityIcon,
  AlertTitle,
} from '@safe-global/views/components/ui/alert'
import type { Account } from '../types'
import { chainLogoUrl } from './shared'

export type LoadWarningStyle = 'chip' | 'each' | 'summary'

type LoadWarningsProps = {
  failed: Account[]
  total: number
  retrying: string[]
  onRetry: (ids: string[]) => void
  style: LoadWarningStyle
}

const SafeName = ({ account }: { account: Account }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-foreground">
    <img src={chainLogoUrl(account.chainId)} alt="" className="size-4 rounded-full" />
    {account.safeName ?? account.name}
    <span className="font-normal text-muted-foreground">on {account.network}</span>
  </span>
)

function RetryButton({ loading, onClick, label }: { loading: boolean; onClick: () => void; label: string }) {
  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={onClick} aria-label={label}>
      {loading ? <Spinner className="size-3" /> : <RefreshCw />}
      {loading ? 'Loading…' : 'Try again'}
    </Button>
  )
}

// Safes whose queue didn't load. One warning per Safe, or one summary for all of them.
export function LoadWarnings({ failed, total, retrying, onRetry, style }: LoadWarningsProps) {
  const [open, setOpen] = useState(false)
  if (!failed.length || style === 'chip') return null
  const loaded = total - failed.length

  if (style === 'each')
    return (
      <div className="mb-5 flex flex-col gap-2">
        {failed.map((account) => (
          <Alert key={account.id} variant="warning" outlined={false}>
            <AlertSeverityIcon variant="warning" />
            <AlertTitle>
              <SafeName account={account} /> didn’t load
            </AlertTitle>
            <AlertDescription>Its transactions aren’t shown, and counts don’t include it.</AlertDescription>
            <AlertAction>
              <RetryButton
                loading={retrying.includes(account.id)}
                onClick={() => onRetry([account.id])}
                label={`Try again for ${account.safeName ?? account.name} on ${account.network}`}
              />
            </AlertAction>
          </Alert>
        ))}
      </div>
    )

  const anyRetrying = failed.some((account) => retrying.includes(account.id))
  return (
    <Alert variant="warning" outlined={false} className="mb-5">
      <AlertSeverityIcon variant="warning" />
      <AlertTitle>
        {failed.length === 1 ? (
          <>
            <SafeName account={failed[0]} /> didn’t load
          </>
        ) : (
          `${failed.length} Safes didn’t load`
        )}
      </AlertTitle>
      <AlertDescription>
        <span>
          Showing transactions from {loaded} of {total} Safes. Counts are partial.
          {failed.length > 1 && (
            <>
              {' '}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-2"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
              >
                {open ? 'Hide Safes' : 'Show Safes'}
              </button>
            </>
          )}
        </span>
        {open && failed.length > 1 && (
          <ul aria-label="Safes that didn’t load" className="mt-2 flex flex-col gap-1">
            {failed.map((account) => (
              <li key={account.id}>
                <SafeName account={account} />
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
      <AlertAction>
        <RetryButton
          loading={anyRetrying}
          onClick={() => onRetry(failed.map((account) => account.id))}
          label={failed.length === 1 ? 'Try again' : `Try again for ${failed.length} Safes`}
        />
      </AlertAction>
    </Alert>
  )
}

const nameOf = (account: Account) => account.safeName ?? account.name

const byNetwork = (accounts: Account[]) => {
  const groups = new Map<string, Account[]>()
  accounts.forEach((account) => groups.set(account.chainId, [...(groups.get(account.chainId) ?? []), account]))
  return [...groups.values()]
}

const SafeLine = ({ account }: { account: Account }) => (
  <li className="flex min-w-0 items-center gap-2 text-sm">
    <Identicon address={account.iconAddress} size={16} />
    <span className="truncate">{nameOf(account)}</span>
    <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">{account.address}</span>
  </li>
)

const NetworkLabel = ({ account, count }: { account: Account; count: number }) => (
  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
    <img src={chainLogoUrl(account.chainId)} alt="" className="size-4 rounded-full" />
    {account.network} · {count}
  </span>
)

type LoadStatusProps = {
  failed: Account[]
  undeployed: Account[]
  retrying: string[]
  onRetry: (ids: string[]) => void
}

// Option E: a quiet chip in the toolbar. It names the Safes that didn't load, by network, with Try again.
// Safes that aren't deployed yet are listed apart and never count as an error.
export function LoadStatusChip({ failed, undeployed, retrying, onRetry }: LoadStatusProps) {
  if (!failed.length && !undeployed.length) return null
  const isRetrying = (accounts: Account[]) => accounts.some((account) => retrying.includes(account.id))
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        {failed.length ? (
          <TriangleAlert className="text-warning-strong" strokeWidth={ICON_STROKE} />
        ) : (
          <Info strokeWidth={ICON_STROKE} />
        )}
        {failed.length ? `${failed.length} not loaded` : `${undeployed.length} not deployed`}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        {failed.length > 0 && (
          <section aria-label="Safes that didn’t load" className="flex flex-col gap-3 p-4">
            <div>
              <p className="text-sm font-medium">
                Couldn’t load {failed.length === 1 ? '1 Safe' : `${failed.length} Safes`}
              </p>
              <p className="text-xs text-muted-foreground">
                Their transactions aren’t shown, and counts leave them out.
              </p>
            </div>
            {byNetwork(failed).map((accounts) => (
              <div key={accounts[0].chainId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <NetworkLabel account={accounts[0]} count={accounts.length} />
                  <Button
                    size="2xs"
                    variant="ghost"
                    disabled={isRetrying(accounts)}
                    onClick={() => onRetry(accounts.map((account) => account.id))}
                    aria-label={`Try again on ${accounts[0].network}`}
                  >
                    {isRetrying(accounts) ? <Spinner className="size-3" /> : <RefreshCw />}
                    {isRetrying(accounts) ? 'Loading…' : 'Try again'}
                  </Button>
                </div>
                <ul className="flex flex-col gap-1">
                  {accounts.map((account) => (
                    <SafeLine key={account.id} account={account} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
        {undeployed.length > 0 && (
          <section
            aria-label="Safes not deployed yet"
            className="flex flex-col gap-2 border-t border-border p-4 first:border-t-0"
          >
            <div>
              <p className="text-sm font-medium">Not deployed yet</p>
              <p className="text-xs text-muted-foreground">Nothing can be pending until they’re deployed.</p>
            </div>
            <ul className="flex flex-col gap-1">
              {undeployed.map((account) => (
                <SafeLine key={account.id} account={account} />
              ))}
            </ul>
          </section>
        )}
        {byNetwork(failed).length > 1 && (
          <div className="border-t border-border p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isRetrying(failed)}
              onClick={() => onRetry(failed.map((account) => account.id))}
            >
              {isRetrying(failed) ? <Spinner className="size-3" /> : <RefreshCw />}
              Try again for all {failed.length}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Option E: when no Safe loads, the page is empty anyway, so it explains why and lists the Safes.
export function NothingLoaded({ failed, undeployed, retrying, onRetry }: LoadStatusProps) {
  const notDeployedOnly = failed.length === 0
  const loading = failed.some((account) => retrying.includes(account.id))
  return (
    <Empty className="rounded-2xl border border-border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">{notDeployedOnly ? <Info /> : <CloudOff />}</EmptyMedia>
        <EmptyTitle>
          <h2>{notDeployedOnly ? 'Your Safes aren’t deployed yet' : 'We couldn’t load your pending transactions'}</h2>
        </EmptyTitle>
        <EmptyDescription>
          {notDeployedOnly
            ? 'Nothing can be pending until they’re deployed.'
            : `${failed.length === 1 ? '1 Safe' : `${failed.length} Safes`} didn’t load. A network may be down, so try again in a moment.`}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ul aria-label="Safes that didn’t load" className="flex w-72 flex-col gap-1 text-left">
          {[...failed, ...undeployed].map((account) => (
            <SafeLine key={account.id} account={account} />
          ))}
        </ul>
        {!notDeployedOnly && (
          <Button variant="outline" disabled={loading} onClick={() => onRetry(failed.map((account) => account.id))}>
            {loading ? <Spinner className="size-3" /> : <RefreshCw />}
            {loading ? 'Loading…' : 'Try again'}
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}

// Option E, grouped by Safe: a Safe that didn't load keeps its band, so you see it where you'd look for it.
export function FailedSafeBand({
  account,
  columnCount,
  loading,
  onRetry,
}: {
  account: Account
  columnCount: number
  loading: boolean
  onRetry: () => void
}) {
  return (
    <tr data-no-hover data-no-divider>
      <td className="rounded-l-lg bg-foreground/[0.03] py-0!" />
      <td colSpan={columnCount - 1} className="rounded-r-lg bg-foreground/[0.03] py-0! pr-3!">
        <div className="flex min-h-11 items-center gap-3 text-sm">
          <span className="flex items-center gap-3 opacity-60">
            <Identicon address={account.iconAddress} size={24} />
            <span className="font-medium">{nameOf(account)}</span>
            <img src={chainLogoUrl(account.chainId)} alt={`on ${account.network}`} className="size-4 rounded-full" />
          </span>
          <span className="text-muted-foreground">Couldn’t load</span>
          <Button
            size="2xs"
            variant="outline"
            className="ml-auto"
            disabled={loading}
            onClick={onRetry}
            aria-label={`Try again for ${nameOf(account)} on ${account.network}`}
          >
            {loading ? <Spinner className="size-3" /> : <RefreshCw />}
            {loading ? 'Loading…' : 'Try again'}
          </Button>
        </div>
      </td>
    </tr>
  )
}

import { useState } from 'react'
import { CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
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
import { CopyableParty } from './CopyableParty'

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
      {loading ? 'Loading…' : 'Reload'}
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
                label={`Reload ${account.safeName ?? account.name} on ${account.network}`}
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
          label={failed.length === 1 ? 'Reload' : `Reload ${failed.length} Safes`}
        />
      </AlertAction>
    </Alert>
  )
}

const nameOf = (account: Account) => account.safeName ?? account.name

// One line per Safe: the same tag as the table (icon, name, network), then Reload. The tag's tooltip has the address.
const SafeLine = ({ account, loading, onReload }: { account: Account; loading: boolean; onReload: () => void }) => (
  <li className="flex min-w-0 items-center gap-2 whitespace-nowrap">
    <CopyableParty
      name={nameOf(account)}
      address={account.iconAddress}
      network={{ chainId: account.chainId, name: account.network }}
      tag
    />
    <Button
      size="2xs"
      variant="ghost"
      className="ml-auto"
      disabled={loading}
      onClick={onReload}
      aria-label={`Reload ${nameOf(account)} on ${account.network}`}
    >
      {loading ? <Spinner className="size-3" /> : <RefreshCw />}
      {loading ? 'Loading…' : 'Reload'}
    </Button>
  </li>
)

type LoadStatusProps = {
  failed: Account[]
  retrying: string[]
  onRetry: (ids: string[]) => void
}

const SafeList = ({ failed, retrying, onRetry, className }: LoadStatusProps & { className?: string }) => (
  <ul aria-label="Safes that didn’t load" className={`flex flex-col gap-1.5 ${className ?? ''}`}>
    {failed.map((account) => (
      <SafeLine
        key={account.id}
        account={account}
        loading={retrying.includes(account.id)}
        onReload={() => onRetry([account.id])}
      />
    ))}
  </ul>
)

// Option E: a quiet chip in the page header, next to Hypernative. It names the Safes that didn't load, with Reload.
// Safes that aren't deployed yet have nothing to load, so they never show here.
export function LoadStatusChip({ failed, retrying, onRetry }: LoadStatusProps) {
  if (!failed.length) return null
  const loadingAll = failed.some((account) => retrying.includes(account.id))
  const label = `${failed.length} ${failed.length === 1 ? 'Safe' : 'Safes'} not loaded`
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="2xs" />}>
        <TriangleAlert className="text-warning-strong" strokeWidth={ICON_STROKE} />
        {label}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <section aria-label={label} className="flex flex-col gap-3 p-4">
          <p className="text-xs text-muted-foreground">Transactions aren’t shown in the table.</p>
          <SafeList failed={failed} retrying={retrying} onRetry={onRetry} />
        </section>
        {failed.length > 1 && (
          <div className="border-t border-border p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={loadingAll}
              onClick={() => onRetry(failed.map((account) => account.id))}
            >
              {loadingAll ? <Spinner className="size-3" /> : <RefreshCw />}
              Reload all {failed.length}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Option E: when no Safe loads, the page is empty anyway, so it explains why and lists the Safes.
export function NothingLoaded({ failed, retrying, onRetry }: LoadStatusProps) {
  const loading = failed.some((account) => retrying.includes(account.id))
  return (
    <Empty className="rounded-2xl border border-border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudOff />
        </EmptyMedia>
        <EmptyTitle>
          <h2>We couldn’t load your pending transactions</h2>
        </EmptyTitle>
        <EmptyDescription>
          {failed.length === 1 ? '1 Safe' : `${failed.length} Safes`} didn’t load. A network may be down, so reload in a
          moment.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <SafeList failed={failed} retrying={retrying} onRetry={onRetry} className="w-72 text-left" />
        <Button variant="outline" disabled={loading} onClick={() => onRetry(failed.map((account) => account.id))}>
          {loading ? <Spinner className="size-3" /> : <RefreshCw />}
          {loading ? 'Loading…' : failed.length > 1 ? `Reload all ${failed.length}` : 'Reload'}
        </Button>
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
            aria-label={`Reload ${nameOf(account)} on ${account.network}`}
          >
            {loading ? <Spinner className="size-3" /> : <RefreshCw />}
            {loading ? 'Loading…' : 'Reload'}
          </Button>
        </div>
      </td>
    </tr>
  )
}

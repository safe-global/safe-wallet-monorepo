import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertSeverityIcon,
  AlertTitle,
} from '@safe-global/views/components/ui/alert'
import type { Account } from '../types'
import { chainLogoUrl } from './shared'

export type LoadWarningStyle = 'each' | 'summary'

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
  if (!failed.length) return null
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

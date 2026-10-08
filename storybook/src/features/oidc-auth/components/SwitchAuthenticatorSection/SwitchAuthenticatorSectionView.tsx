import { Plus, Smartphone } from 'lucide-react'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'

const formatDate = (iso?: string): string =>
  iso
    ? new Date(iso).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

export type SwitchAuthenticatorSectionViewProps = {
  isLoading: boolean
  authenticator?: { createdAt?: string }
  error?: string
  onEnroll: () => void
}

export const SwitchAuthenticatorSectionView = ({
  isLoading,
  authenticator,
  error,
  onEnroll,
}: SwitchAuthenticatorSectionViewProps) => {
  return (
    <section className="bg-card rounded-2xl p-6 mb-3" data-testid="settings-account-authenticators">
      <div className="flex items-center gap-3 mb-2">
        <Typography variant="paragraph-bold" className="block tracking-tight">
          Two-factor authentication
        </Typography>
        {authenticator && (
          <Badge variant="success" size="status" shape="status">
            <BadgeDot />
            Active
          </Badge>
        )}
      </div>
      <Typography variant="paragraph-small" color="muted" className="mb-4 block max-w-[560px]">
        Required for everyone in this Workspace. Signing in takes your email code and a 6-digit code from your
        authenticator app.
      </Typography>

      {error && (
        <Typography variant="paragraph-small" className="mb-4 block text-destructive">
          {error}
        </Typography>
      )}

      {isLoading ? (
        <Skeleton className="h-[56px] w-full rounded-lg" />
      ) : authenticator ? (
        <div className="flex items-center justify-between gap-4 py-2" data-testid="authenticator-row">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <Typography variant="paragraph-small-bold" className="block truncate">
                Authenticator app
              </Typography>
              {authenticator.createdAt && (
                <Typography variant="paragraph-mini" color="muted" className="block">
                  Added {formatDate(authenticator.createdAt)}
                </Typography>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onEnroll} data-testid="change-authenticator-btn">
            Change
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={onEnroll} data-testid="add-authenticator-btn">
          <Plus className="h-3.5 w-3.5" />
          Add authenticator
        </Button>
      )}
    </section>
  )
}

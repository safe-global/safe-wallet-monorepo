import { Plus, ShieldCheck, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { useAuthenticators } from '../../hooks/useAuthenticators'

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

/**
 * Two-factor authentication section for the spaces account settings page.
 * Renders nothing for non-OIDC sessions.
 *
 * One authenticator slot: a skeleton while loading, then either the
 * enrolled authenticator (with a "Change" action) or an "Add authenticator"
 * button. Both route through the provider's hosted pages: verify with the
 * current factor, scan the new QR code there, and return.
 */
const SwitchAuthenticatorSection = () => {
  const { isOidcSession, authenticators, error, enrollNewAuthenticator } = useAuthenticators()

  if (!isOidcSession) {
    return null
  }

  const isLoading = authenticators === undefined && !error
  const authenticator = authenticators?.[0]

  return (
    <section className="bg-card rounded-2xl p-6 mb-3" data-testid="settings-account-authenticators">
      <div className="flex items-center gap-3 mb-2">
        <Typography variant="paragraph-bold" className="block tracking-tight">
          Two-factor authentication
        </Typography>
        {authenticator && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Active
          </span>
        )}
      </div>
      <Typography variant="paragraph-small" color="muted" className="mb-4 block max-w-[560px]">
        Required for everyone in this workspace. Signing in takes your email code and a 6-digit code from your
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
          <Button variant="outline" size="sm" onClick={enrollNewAuthenticator} data-testid="change-authenticator-btn">
            Change
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={enrollNewAuthenticator} data-testid="add-authenticator-btn">
          <Plus className="h-3.5 w-3.5" />
          Add authenticator
        </Button>
      )}
    </section>
  )
}

export default SwitchAuthenticatorSection

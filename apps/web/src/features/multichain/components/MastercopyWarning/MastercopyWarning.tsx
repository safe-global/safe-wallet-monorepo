import { useCallback, useContext } from 'react'
import { Alert, AlertDescription, AlertTitle, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { TxModalContext } from '@/components/tx-flow'
import { MigrateSafeL2Flow, UpdateSafeFlow } from '@/components/tx-flow/flows'
import { ActionCard } from '@/components/common/ActionCard'
import ExternalLink from '@/components/common/ExternalLink'
import CheckWallet from '@/components/common/CheckWallet'
import InfoIcon from '@/public/images/notifications/info.svg'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { trackEvent } from '@/services/analytics'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'
import { useMastercopyMigration } from '../../hooks/useMastercopyMigration'

const CLI_LINK = 'https://github.com/5afe/safe-cli'

type MastercopyWarningProps = {
  /**
   * `dashboard` (default) renders the compact ActionCard shown in the attention panel.
   * `settings` renders the richer Alert shown on the Contract version settings page,
   * which also prompts non-critical updates.
   */
  variant?: 'dashboard' | 'settings'
}

export const MastercopyWarning = ({ variant = 'dashboard' }: MastercopyWarningProps) => {
  const { action, isCritical, isOfficialDeployer, isBytecodeLoading, latestVersion, changelogUrl } =
    useMastercopyMigration()
  const isOwner = useIsSafeOwner()
  const { setTxFlow } = useContext(TxModalContext)
  const openMigrateModal = useCallback(() => setTxFlow(<MigrateSafeL2Flow />), [setTxFlow])
  const openUpdateModal = useCallback(() => setTxFlow(<UpdateSafeFlow />), [setTxFlow])

  // Don't show a warning while the bytecode comparison is still resolving
  if (isBytecodeLoading) return null

  if (action === 'migrate') {
    return (
      <Alert variant="warning" outlined={false} data-testid="action-card">
        <AlertSeverityIcon variant="warning" />
        <AlertTitle className="font-bold">This Safe is running an unsupported version</AlertTitle>
        <AlertDescription>
          It may miss security fixes and improvements. You should migrate it to a compatible version.
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-foreground"
              data-testid="migrate-mastercopy-btn"
              onClick={() => {
                trackEvent(ATTENTION_PANEL_EVENTS.MIGRATE_MASTERCOPY)
                openMigrateModal()
              }}
            >
              Migrate
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (action === 'redeploy') {
    return (
      <Alert variant="warning" outlined={false} data-testid="redeploy-mastercopy-warning">
        <AlertSeverityIcon variant="warning" />
        <AlertTitle className="font-bold">
          This Safe can&apos;t be upgraded to {latestVersion} on this network.
        </AlertTitle>
        <AlertDescription>
          zkSync Safes created before the EVM upgrade can&apos;t move to the new contracts in place. To use the latest
          version, create a new Safe and transfer your assets to it.
        </AlertDescription>
      </Alert>
    )
  }

  if (action === 'cli') {
    return (
      <Alert variant="warning" outlined={false} data-testid="action-card">
        <AlertSeverityIcon variant="warning" />
        <AlertTitle className="font-bold">This Safe is running an unsupported version</AlertTitle>
        <AlertDescription>
          It may miss security fixes and improvements. You must use our CLI tool to migrate.
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-foreground"
              data-testid="get-cli-link"
              render={<a href={CLI_LINK} target="_blank" rel="noopener noreferrer" />}
              onClick={() => trackEvent(ATTENTION_PANEL_EVENTS.GET_CLI_MASTERCOPY)}
            >
              Get CLI
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (action === 'update' && isOfficialDeployer) {
    // Settings intentionally prompts non-critical updates too, hence no `isCritical` gate here.
    if (variant === 'settings') {
      return (
        <Alert>
          <InfoIcon className="size-4 text-[var(--color-secondary-main)]" />
          <AlertTitle>
            New version is available: {latestVersion} (<ExternalLink href={changelogUrl}>changelog</ExternalLink>)
          </AlertTitle>

          <AlertDescription>
            <p>
              Update now to take advantage of new features and the highest security standards available. You will need
              to confirm this update just like any other transaction.
            </p>

            <CheckWallet>
              {(isOk) => (
                <Button onClick={openUpdateModal} disabled={!isOk}>
                  Update
                </Button>
              )}
            </CheckWallet>
          </AlertDescription>
        </Alert>
      )
    }

    // Dashboard only nags for critical updates.
    if (isCritical) {
      return (
        <ActionCard
          severity="info"
          title={`New Safe version is available - ${latestVersion}. `}
          content="Update now to take advantage of new features and the highest security standards available. You will need to confirm this update just like any other transaction."
          action={isOwner ? { label: 'Update', onClick: openUpdateModal } : undefined}
          trackingEvent={ATTENTION_PANEL_EVENTS.UPDATE_OUTDATED_MASTERCOPY}
          actionTestId="update-mastercopy-btn"
        />
      )
    }
  }

  return null
}

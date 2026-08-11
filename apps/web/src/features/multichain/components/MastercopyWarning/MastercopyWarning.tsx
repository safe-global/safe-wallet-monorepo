import { useCallback, useContext } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { TxModalContext } from '@/components/tx-flow'
import { MigrateSafeL2Flow, UpdateSafeFlow } from '@/components/tx-flow/flows'
import { ActionCard } from '@/components/common/ActionCard'
import ExternalLink from '@/components/common/ExternalLink'
import CheckWallet from '@/components/common/CheckWallet'
import InfoIcon from '@/public/images/notifications/info.svg'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
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
      <ActionCard
        severity="warning"
        title="This Safe is running an unsupported version "
        content="and may miss security fixes and improvements. You should migrate it to a compatible version."
        action={{ label: 'Migrate', onClick: openMigrateModal }}
        trackingEvent={ATTENTION_PANEL_EVENTS.MIGRATE_MASTERCOPY}
        actionTestId="migrate-mastercopy-btn"
      />
    )
  }

  if (action === 'redeploy') {
    return (
      <ActionCard
        severity="warning"
        title={`This Safe can't be upgraded to ${latestVersion} on this network.`}
        content="zkSync Safes created before the EVM upgrade can't move to the new contracts in place. To use the latest version, create a new Safe and transfer your assets to it."
        testId="redeploy-mastercopy-warning"
      />
    )
  }

  if (action === 'cli') {
    return (
      <ActionCard
        severity="warning"
        title="This Safe is running an unsupported version "
        content="and may miss security fixes and improvements. You must use our CLI tool to migrate."
        action={{ label: 'Get CLI', href: CLI_LINK, target: '_blank', rel: 'noopener noreferrer' }}
        trackingEvent={ATTENTION_PANEL_EVENTS.GET_CLI_MASTERCOPY}
        actionTestId="get-cli-link"
      />
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

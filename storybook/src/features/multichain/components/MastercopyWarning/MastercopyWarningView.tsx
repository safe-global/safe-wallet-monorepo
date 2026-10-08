import type { ReactElement, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { ActionCardProps } from '@views/components/common/ActionCard/ActionCardView'
import ExternalLink from '@/components/common/ExternalLink'
import InfoIcon from '@/public/images/notifications/info.svg'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'
import type { MastercopyMigration } from '@/features/multichain/hooks/useMastercopyMigration'

const CLI_LINK = 'https://github.com/5afe/safe-cli'

export type MastercopyWarningViewProps = Pick<
  MastercopyMigration,
  'action' | 'isCritical' | 'isOfficialDeployer' | 'latestVersion' | 'changelogUrl'
> & {
  variant: 'dashboard' | 'settings'
  isOwner: boolean
  onMigrate: () => void
  onGetCli: () => void
  onUpdate: () => void
  checkWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  renderActionCard: (props: ActionCardProps) => ReactNode
}

export const MastercopyWarningView = ({
  variant,
  action,
  isCritical,
  isOfficialDeployer,
  latestVersion,
  changelogUrl,
  isOwner,
  onMigrate,
  onGetCli,
  onUpdate,
  checkWallet,
  renderActionCard,
}: MastercopyWarningViewProps) => {
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
              onClick={onMigrate}
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
              onClick={onGetCli}
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
        <Alert variant="success">
          <InfoIcon className="size-4" />
          <AlertTitle>
            New version is available: {latestVersion} (
            <ExternalLink href={changelogUrl} className="font-bold hover:!text-[var(--color-primary-light)]">
              changelog
            </ExternalLink>
            )
          </AlertTitle>

          <AlertDescription>
            <p>
              Update now to take advantage of new features and the highest security standards available. You will need
              to confirm this update just like any other transaction.
            </p>

            {checkWallet((isOk) => (
              <Button onClick={onUpdate} disabled={!isOk}>
                Update
              </Button>
            ))}
          </AlertDescription>
        </Alert>
      )
    }

    // Dashboard only nags for critical updates.
    if (isCritical) {
      return (
        <>
          {renderActionCard({
            severity: 'info',
            title: `New Safe version is available - ${latestVersion}. `,
            content:
              'Update now to take advantage of new features and the highest security standards available. You will need to confirm this update just like any other transaction.',
            action: isOwner ? { label: 'Update', onClick: onUpdate } : undefined,
            trackingEvent: ATTENTION_PANEL_EVENTS.UPDATE_OUTDATED_MASTERCOPY,
            actionTestId: 'update-mastercopy-btn',
          })}
        </>
      )
    }
  }

  return null
}

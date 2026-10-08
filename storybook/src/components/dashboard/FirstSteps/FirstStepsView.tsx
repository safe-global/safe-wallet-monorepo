import classnames from 'classnames'
import type { ReactElement, ReactNode } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { Card, WidgetBody, WidgetContainer } from '@views/components/dashboard/styled'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Circle, CircleCheck, CircleCheckBig, Lightbulb, Plus } from 'lucide-react'
import { ProgressRing } from '@views/components/dashboard/FirstSteps/ProgressRing'
import css from './styles.module.css'

const StatusCard = ({
  badge,
  title,
  content,
  completed,
  children,
}: {
  badge: ReactNode
  title: string
  content: string
  completed: boolean
  children?: ReactNode
}) => {
  return (
    <Card className={css.card}>
      <div className={css.topBadge}>{badge}</div>
      <div className={css.status}>
        {completed ? (
          <CircleCheck className="size-6 text-[var(--color-success-main)]" />
        ) : (
          <Circle className="size-6" />
        )}
      </div>
      <Typography variant="h4" className="mb-4 font-bold">
        {title}
      </Typography>
      <Typography variant="paragraph-small" className="block text-[var(--color-primary-light)]">
        {content}
      </Typography>
      {children}
    </Card>
  )
}

const ActivationStatusWidget = ({ explorerLink }: { explorerLink?: string }) => {
  return (
    <StatusCard
      badge={
        <Typography variant="paragraph-small" className="block rounded-b bg-[var(--color-border-light)] px-2 py-1">
          Just submitted
        </Typography>
      }
      title="Transaction pending"
      content="Depending on network usage, it can take some time until the transaction is successfully processed and executed."
      completed={false}
    >
      {explorerLink && (
        <ExternalLink href={explorerLink} className="mt-4">
          View Explorer
        </ExternalLink>
      )}
    </StatusCard>
  )
}

const UsefulHintsWidget = () => {
  return (
    <StatusCard
      badge={
        <Typography variant="paragraph-small" className={classnames(css.badgeText, css.badgeTextInfo)}>
          <Lightbulb className="mr-1 size-5" />
          Did you know
        </Typography>
      }
      title="Explore over 70+ dApps"
      content="In our Safe App section you can connect your Safe to over 70 dApps directly or via Wallet Connect to interact with any application."
      completed={false}
    />
  )
}

export type ModalDialogSlotProps = {
  open: boolean
  onClose: () => void
  dialogTitle: string
  hideChainIndicator: boolean
  children: ReactNode
}

export type AddFundsWidgetViewProps = {
  completed: boolean
  renderModalDialog: (props: ModalDialogSlotProps) => ReactNode
  open: boolean
  onToggleDialog: () => void
  nativeCurrencyName?: string
  chainShortName?: string
  isQrShortNameEnabled: boolean
  onQrShortNameChange: (checked: boolean) => void
  qrCode: ReactNode
  addressInfo: ReactNode
}

export function AddFundsWidgetView({
  completed,
  renderModalDialog,
  open,
  onToggleDialog,
  nativeCurrencyName,
  chainShortName,
  isQrShortNameEnabled,
  onQrShortNameChange,
  qrCode,
  addressInfo,
}: AddFundsWidgetViewProps): ReactElement {
  const title = 'Add native assets'
  const content = `Receive ${nativeCurrencyName} to start interacting with your account.`

  return (
    <StatusCard
      badge={
        <Typography variant="paragraph-small" className={css.badgeText}>
          First interaction
        </Typography>
      }
      title={title}
      content={content}
      completed={completed}
    >
      {!completed && (
        <>
          <div className="mt-4">
            <Track {...OVERVIEW_EVENTS.ADD_FUNDS}>
              <Button data-testid="add-funds-btn" onClick={onToggleDialog}>
                <Plus />
                Add funds
              </Button>
            </Track>
          </div>
          {renderModalDialog({
            open,
            onClose: onToggleDialog,
            dialogTitle: 'Add funds to your Safe account',
            hideChainIndicator: true,
            children: (
              <div className="flex flex-col gap-6 px-8 pb-10 pt-2">
                <div data-testid="qr-code" className="flex flex-col items-center gap-4">
                  <div className="inline-flex rounded-md border border-[var(--color-border-light)] p-2">{qrCode}</div>
                  <Label className="justify-center">
                    <Switch
                      data-testid="qr-code-switch"
                      checked={isQrShortNameEnabled}
                      onCheckedChange={(checked) => onQrShortNameChange(checked)}
                    />
                    <span>
                      QR code with chain prefix (<b>{chainShortName}:</b>)
                    </span>
                  </Label>
                </div>

                <div className="flex flex-col gap-4">
                  <Typography className="text-center">
                    Copy your address to send tokens from a different account.
                  </Typography>

                  <div data-testid="address-info" className="rounded-md bg-[var(--color-background-main)] p-4 text-sm">
                    {addressInfo}
                  </div>
                </div>
              </div>
            ),
          })}
        </>
      )}
    </StatusCard>
  )
}

export type FirstTransactionWidgetViewProps = {
  completed: boolean
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  onCreateTransaction: () => void
  firstTxFlow?: ReactNode
}

export function FirstTransactionWidgetView({
  completed,
  renderCheckWallet,
  onCreateTransaction,
  firstTxFlow,
}: FirstTransactionWidgetViewProps): ReactElement {
  const title = 'Create your first transaction'
  const content = 'Simply send funds, add a new signer or swap tokens through a safe app.'

  return (
    <>
      <StatusCard
        badge={
          <Typography variant="paragraph-small" className={css.badgeText}>
            First interaction
          </Typography>
        }
        title={title}
        content={content}
        completed={completed}
      >
        {!completed &&
          renderCheckWallet((isOk) => (
            <Track {...OVERVIEW_EVENTS.NEW_TRANSACTION} label="onboarding">
              <Button
                data-testid="create-tx-btn"
                onClick={onCreateTransaction}
                variant="outline"
                className="mt-4"
                disabled={!isOk}
              >
                Create transaction
              </Button>
            </Track>
          ))}
      </StatusCard>
      {firstTxFlow}
    </>
  )
}

export type ActivateSafeWidgetViewProps = {
  chainName?: string
  activateAccountButton?: ReactNode
  firstTxFlow?: ReactNode
}

export function ActivateSafeWidgetView({
  chainName,
  activateAccountButton,
  firstTxFlow,
}: ActivateSafeWidgetViewProps): ReactElement {
  const title = `Activate account ${chainName !== undefined ? 'on ' + chainName : ''}`
  const content = 'Activate your account to start using all benefits of Safe'

  return (
    <>
      <StatusCard
        badge={
          <Typography variant="paragraph-small" className={css.badgeText}>
            First interaction
          </Typography>
        }
        title={title}
        completed={false}
        content={content}
      >
        <div className="mt-4">{activateAccountButton}</div>
      </StatusCard>
      {firstTxFlow}
    </>
  )
}

const AccountReadyWidget = () => {
  return (
    <Card className={classnames(css.card, css.accountReady)}>
      <div className={classnames(css.checkIcon)}>
        <CircleCheckBig className="size-[60px]" />
      </div>
      <Typography variant="h4" className="mb-4 mt-4 font-bold">
        Safe account is ready!
      </Typography>
      <Typography>Continue to improve your account security and unlock more features</Typography>
    </Card>
  )
}

export type FirstStepsViewProps = {
  isActivating: boolean
  progress: number
  stepsCompleted: number
  totalSteps: number
  hasChain: boolean
  explorerLink?: string
  showActivateSafe: boolean
  showHnDashboardBanner: boolean
  addFundsWidget: ReactNode
  activateSafeWidget: ReactNode
  firstTransactionWidget: ReactNode
  hnDashboardBanner: ReactNode
}

export function FirstStepsView({
  isActivating,
  progress,
  stepsCompleted,
  totalSteps,
  hasChain,
  explorerLink,
  showActivateSafe,
  showHnDashboardBanner,
  addFundsWidget,
  activateSafeWidget,
  firstTransactionWidget,
  hnDashboardBanner,
}: FirstStepsViewProps): ReactElement {
  return (
    <WidgetContainer>
      <WidgetBody data-testid="activation-section">
        <div className="mb-4 flex flex-row flex-nowrap items-center gap-6">
          <div className="relative inline-flex">
            <ProgressRing
              indeterminate={isActivating}
              value={progress === 0 ? 3 : progress} // Just to give an indication of the progress even at 0%
            />
          </div>
          <div>
            <Typography variant="h2" className="mb-2">
              {isActivating ? 'Account is being activated...' : 'Activate your Safe account'}
            </Typography>

            {isActivating ? (
              <Typography variant="paragraph-small" className="block">
                <strong>This may take a few minutes.</strong> Once activated, your account will be up and running.
              </Typography>
            ) : (
              <Typography variant="paragraph-small" className="block">
                <strong>
                  {stepsCompleted} of {totalSteps} steps completed.
                </strong>{' '}
                Finish the next steps to start using all Safe account features:
              </Typography>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            {isActivating && hasChain ? <ActivationStatusWidget explorerLink={explorerLink} /> : addFundsWidget}
          </div>

          <div>
            {isActivating ? <UsefulHintsWidget /> : showActivateSafe ? activateSafeWidget : firstTransactionWidget}
          </div>

          <div>{showHnDashboardBanner ? hnDashboardBanner : <AccountReadyWidget />}</div>
        </div>
      </WidgetBody>
    </WidgetContainer>
  )
}

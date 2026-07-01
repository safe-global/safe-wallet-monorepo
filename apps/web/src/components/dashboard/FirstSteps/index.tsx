import CheckWallet from '@/components/common/CheckWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import ExternalLink from '@/components/common/ExternalLink'
import ModalDialog from '@/components/common/ModalDialog'
import QRCode from '@/components/common/QRCode'
import Track from '@/components/common/Track'
import { CounterfactualFeature } from '@/features/counterfactual'
import { useLoadFeature } from '@/features/__core__'
import { selectUndeployedSafe } from '@/features/counterfactual/store'
import { isReplayedSafeProps } from '@/features/counterfactual/services'
import useBalances from '@/hooks/useBalances'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setQrShortName } from '@/store/settingsSlice'
import { selectOutgoingTransactions } from '@/store/txHistorySlice'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import classnames from 'classnames'
import { type ReactNode, useState } from 'react'
import { Card, WidgetBody, WidgetContainer } from '@/components/dashboard/styled'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import { Circle, CircleCheck, CircleCheckBig, Lightbulb } from 'lucide-react'
import css from './styles.module.css'
import { ProgressRing } from './ProgressRing'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { BannerType, useBannerVisibility, HnDashboardBannerWithNoBalanceCheck } from '@/features/hypernative'
import { calculateProgress } from './utils'

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

const AddFundsWidget = ({ completed }: { completed: boolean }) => {
  const [open, setOpen] = useState<boolean>(false)
  const { safeAddress } = useSafeInfo()
  const chain = useCurrentChain()
  const dispatch = useAppDispatch()
  const settings = useAppSelector(selectSettings)
  const qrPrefix = settings.shortName.qr ? `${chain?.shortName}:` : ''
  const qrCode = `${qrPrefix}${safeAddress}`

  const title = 'Add native assets'
  const content = `Receive ${chain?.nativeCurrency.name} to start interacting with your account.`

  const toggleDialog = () => {
    setOpen((prev) => !prev)
  }

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
              <Button data-testid="add-funds-btn" onClick={toggleDialog}>
                Add funds
              </Button>
            </Track>
          </div>
          <ModalDialog
            open={open}
            onClose={toggleDialog}
            dialogTitle="Add funds to your Safe account"
            hideChainIndicator
          >
            <div className="px-8 pb-10 pt-8">
              <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <div data-testid="qr-code" className="text-center">
                  <div className="inline-flex rounded-md border border-[var(--color-border-light)] p-2">
                    <QRCode value={qrCode} size={132} />
                  </div>
                  <div>
                    <Label className="justify-center">
                      <Switch
                        data-testid="qr-code-switch"
                        checked={settings.shortName.qr}
                        onCheckedChange={(checked) => dispatch(setQrShortName(checked))}
                      />
                      <span>
                        QR code with chain prefix (<b>{chain?.shortName}:</b>)
                      </span>
                    </Label>
                  </div>
                </div>
                <div className="flex-1">
                  <Typography className="mb-4">Copy your address to send tokens from a different account.</Typography>

                  <div
                    data-testid="address-info"
                    className="self-start rounded-md bg-[var(--color-background-main)] p-4 text-sm"
                  >
                    <EthHashInfo
                      address={safeAddress}
                      showName={false}
                      shortAddress={false}
                      showCopyButton
                      hasExplorer
                      avatarSize={24}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ModalDialog>
        </>
      )}
    </StatusCard>
  )
}

const FirstTransactionWidget = ({
  completed,
  FirstTxFlow,
}: {
  completed: boolean
  FirstTxFlow?: React.ComponentType<{ open: boolean; onClose: () => void }>
}) => {
  const [open, setOpen] = useState<boolean>(false)

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
        {!completed && (
          <CheckWallet>
            {(isOk) => (
              <Track {...OVERVIEW_EVENTS.NEW_TRANSACTION} label="onboarding">
                <Button
                  data-testid="create-tx-btn"
                  onClick={() => setOpen(true)}
                  variant="outline"
                  className="mt-4"
                  disabled={!isOk}
                >
                  Create transaction
                </Button>
              </Track>
            )}
          </CheckWallet>
        )}
      </StatusCard>
      {FirstTxFlow && <FirstTxFlow open={open} onClose={() => setOpen(false)} />}
    </>
  )
}

const ActivateSafeWidget = ({
  chain,
  ActivateAccountButton,
  FirstTxFlow,
}: {
  chain: Chain | undefined
  ActivateAccountButton?: React.ComponentType
  FirstTxFlow?: React.ComponentType<{ open: boolean; onClose: () => void }>
}) => {
  const [open, setOpen] = useState<boolean>(false)

  const title = `Activate account ${chain ? 'on ' + chain.chainName : ''}`
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
        <div className="mt-4">{ActivateAccountButton && <ActivateAccountButton />}</div>
      </StatusCard>
      {FirstTxFlow && <FirstTxFlow open={open} onClose={() => setOpen(false)} />}
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

const FirstSteps = () => {
  const { balances } = useBalances()
  const { safe, safeAddress } = useSafeInfo()
  const outgoingTransactions = useAppSelector(selectOutgoingTransactions)
  const chain = useCurrentChain()
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, safe.chainId, safeAddress))
  const { ActivateAccountButton, FirstTxFlow } = useLoadFeature(CounterfactualFeature)

  // Check if banner should show (for conditional rendering of AccountReadyWidget)
  // Use NoBalanceCheck for undeployed safes as the banner should be shown for all non-active safes as well
  const { showBanner: showHnDashboardBanner } = useBannerVisibility(BannerType.NoBalanceCheck)

  const isMultiSig = safe.threshold > 1
  const isReplayedSafe = undeployedSafe && isReplayedSafeProps(undeployedSafe?.props)

  const hasNonZeroBalance = balances && (balances.items.length > 1 || BigInt(balances.items[0]?.balance || 0) > 0)
  const hasOutgoingTransactions = !!outgoingTransactions && outgoingTransactions.length > 0
  const completedItems = [hasNonZeroBalance, hasOutgoingTransactions]

  const progress = calculateProgress(completedItems)
  const stepsCompleted = completedItems.filter((item) => item).length

  if (safe.deployed) return null

  const isActivating = undeployedSafe?.status.status !== 'AWAITING_EXECUTION'

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
                  {stepsCompleted} of {completedItems.length} steps completed.
                </strong>{' '}
                Finish the next steps to start using all Safe account features:
              </Typography>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            {isActivating && chain ? (
              <ActivationStatusWidget
                explorerLink={
                  undeployedSafe?.status.txHash
                    ? getExplorerLink(undeployedSafe.status.txHash, chain.blockExplorerUriTemplate).href
                    : undefined
                }
              />
            ) : (
              <AddFundsWidget completed={hasNonZeroBalance} />
            )}
          </div>

          <div>
            {isActivating ? (
              <UsefulHintsWidget />
            ) : isMultiSig || isReplayedSafe ? (
              <ActivateSafeWidget
                chain={chain}
                ActivateAccountButton={ActivateAccountButton}
                FirstTxFlow={FirstTxFlow}
              />
            ) : (
              <FirstTransactionWidget completed={hasOutgoingTransactions} FirstTxFlow={FirstTxFlow} />
            )}
          </div>

          <div>{showHnDashboardBanner ? <HnDashboardBannerWithNoBalanceCheck /> : <AccountReadyWidget />}</div>
        </div>
      </WidgetBody>
    </WidgetContainer>
  )
}

export default FirstSteps

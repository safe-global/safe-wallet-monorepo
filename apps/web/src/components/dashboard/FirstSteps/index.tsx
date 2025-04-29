import { BuyCryptoOptions } from '@/components/common/BuyCryptoButton'
import CheckWallet from '@/components/common/CheckWallet'
import EthHashInfo from '@/components/common/EthHashInfo'
import ExternalLink from '@/components/common/ExternalLink'
import ModalDialog from '@/components/common/ModalDialog'
import QRCode from '@/components/common/QRCode'
import Track from '@/components/common/Track'
import FirstTxFlow from '@/features/counterfactual/FirstTxFlow'
import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import useBalances from '@/hooks/useBalances'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectSettings, setQrShortName } from '@/store/settingsSlice'
import { selectOutgoingTransactions } from '@/store/txHistorySlice'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import classnames from 'classnames'
import { type ReactNode, useState } from 'react'
import { Card, WidgetBody, WidgetContainer } from '@/components/dashboard/styled'
import { Box, Button, CircularProgress, Divider, FormControlLabel, Grid, Switch, Typography } from '@mui/material'
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import css from './styles.module.css'
import ActivateAccountButton from '@/features/counterfactual/ActivateAccountButton'
import { isReplayedSafeProps } from '@/features/counterfactual/utils'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'

const calculateProgress = (items: boolean[]) => {
  const totalNumberOfItems = items.length
  const completedItems = items.filter((item) => item)
  return Math.round((completedItems.length / totalNumberOfItems) * 100)
}

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
          <CheckCircleRoundedIcon color="success" fontSize="medium" />
        ) : (
          <CircleOutlinedIcon color="inherit" fontSize="medium" />
        )}
      </div>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'bold',
          mb: 2,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'primary.light',
        }}
      >
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
        <Typography
          variant="body2"
          sx={{ backgroundColor: 'border.light', borderRadius: '0 0 4px 4px', padding: '4px 8px' }}
        >
          Just submitted
        </Typography>
      }
      title="Transaction pending"
      content="Depending on network usage, it can take some time until the transaction is successfully processed and executed."
      completed={false}
    >
      {explorerLink && (
        <ExternalLink href={explorerLink} sx={{ mt: 2 }}>
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
        <Typography variant="body2" className={classnames(css.badgeText, css.badgeTextInfo)}>
          <LightbulbOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
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
        <Typography variant="body2" className={css.badgeText}>
          First interaction
        </Typography>
      }
      title={title}
      content={content}
      completed={completed}
    >
      {!completed && (
        <>
          <Box
            sx={{
              mt: 2,
            }}
          >
            <Track {...OVERVIEW_EVENTS.ADD_FUNDS}>
              <Button
                data-testid="add-funds-btn"
                onClick={toggleDialog}
                variant="contained"
                size="small"
                sx={{ minHeight: '40px' }}
              >
                Add funds
              </Button>
            </Track>
          </Box>
          <ModalDialog
            open={open}
            onClose={toggleDialog}
            dialogTitle="Add funds to your Safe Account"
            hideChainIndicator
          >
            <Box
              sx={{
                px: 4,
                pb: 5,
                pt: 4,
              }}
            >
              <Grid
                container
                spacing={2}
                sx={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 4,
                }}
              >
                <Grid
                  data-testid="qr-code"
                  item
                  sx={{
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      border: 1,
                      borderRadius: '6px',
                      borderColor: 'border.light',
                      display: 'inline-flex',
                    }}
                  >
                    <QRCode value={qrCode} size={132} />
                  </Box>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          data-testid="qr-code-switch"
                          checked={settings.shortName.qr}
                          onChange={(e) => dispatch(setQrShortName(e.target.checked))}
                        />
                      }
                      label={
                        <>
                          QR code with chain prefix (<b>{chain?.shortName}:</b>)
                        </>
                      }
                    />
                  </Box>
                </Grid>
                <Grid item xs>
                  <Typography
                    sx={{
                      mb: 2,
                    }}
                  >
                    Add funds directly from your bank account or copy your address to send tokens from a different
                    account.
                  </Typography>

                  <Box
                    data-testid="address-info"
                    sx={{
                      bgcolor: 'background.main',
                      p: 2,
                      borderRadius: '6px',
                      alignSelf: 'flex-start',
                      fontSize: '14px',
                    }}
                  >
                    <EthHashInfo
                      address={safeAddress}
                      showName={false}
                      shortAddress={false}
                      showCopyButton
                      hasExplorer
                      avatarSize={24}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Box
                sx={{
                  mb: 4,
                  position: 'relative',
                  textAlign: 'center',
                }}
              >
                <Typography className={css.orDivider}>or</Typography>
                <Divider />
              </Box>

              <Typography
                sx={{
                  mb: 2,
                }}
              >
                Buy crypto with fiat:
              </Typography>
              <BuyCryptoOptions />
            </Box>
          </ModalDialog>
        </>
      )}
    </StatusCard>
  )
}

const FirstTransactionWidget = ({ completed }: { completed: boolean }) => {
  const [open, setOpen] = useState<boolean>(false)

  const title = 'Create your first transaction'
  const content = 'Simply send funds, add a new signer or swap tokens through a safe app.'

  return (
    <>
      <StatusCard
        badge={
          <Typography variant="body2" className={css.badgeText}>
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
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2, minHeight: '40px' }}
                  disabled={!isOk}
                >
                  Create transaction
                </Button>
              </Track>
            )}
          </CheckWallet>
        )}
      </StatusCard>
      <FirstTxFlow open={open} onClose={() => setOpen(false)} />
    </>
  )
}

const ActivateSafeWidget = ({ chain }: { chain: ChainInfo | undefined }) => {
  const [open, setOpen] = useState<boolean>(false)

  const title = `Activate account ${chain ? 'on ' + chain.chainName : ''}`
  const content = 'Activate your account to start using all benefits of Safe'

  return (
    <>
      <StatusCard
        badge={
          <Typography variant="body2" className={css.badgeText}>
            First interaction
          </Typography>
        }
        title={title}
        completed={false}
        content={content}
      >
        <Box
          sx={{
            mt: 2,
          }}
        >
          <ActivateAccountButton />
        </Box>
      </StatusCard>
      <FirstTxFlow open={open} onClose={() => setOpen(false)} />
    </>
  )
}

const AccountReadyWidget = () => {
  return (
    <Card className={classnames(css.card, css.accountReady)}>
      <div className={classnames(css.checkIcon)}>
        <CheckCircleOutlineRoundedIcon sx={{ width: '60px', height: '60px' }} />
      </div>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'bold',
          mb: 2,
          mt: 2,
        }}
      >
        Safe Account is ready!
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
        <Grid
          container
          sx={{
            gap: 3,
            mb: 2,
            flexWrap: 'nowrap',
            alignItems: 'center',
          }}
        >
          <Grid
            item
            sx={{
              position: 'relative',
              display: 'inline-flex',
            }}
          >
            <svg className={css.gradient}>
              <defs>
                <linearGradient
                  id="progress_gradient"
                  x1="21.1648"
                  y1="8.21591"
                  x2="-9.95028"
                  y2="22.621"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#5FDDFF" />
                  <stop offset="1" stopColor="#12FF80" />
                </linearGradient>
              </defs>
            </svg>
            <CircularProgress variant="determinate" value={100} className={css.circleBg} size={60} thickness={5} />
            <CircularProgress
              variant={isActivating ? 'indeterminate' : 'determinate'}
              value={progress === 0 ? 3 : progress} // Just to give an indication of the progress even at 0%
              className={css.circleProgress}
              size={60}
              thickness={5}
              sx={{ 'svg circle': { stroke: 'url(#progress_gradient)', strokeLinecap: 'round' } }}
            />
          </Grid>
          <Grid item>
            <Typography
              component="div"
              variant="h2"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              {isActivating ? 'Account is being activated...' : 'Activate your Safe Account'}
            </Typography>

            {isActivating ? (
              <Typography variant="body2">
                <strong>This may take a few minutes.</strong> Once activated, your account will be up and running.
              </Typography>
            ) : (
              <Typography variant="body2">
                <strong>
                  {stepsCompleted} of {completedItems.length} steps completed.
                </strong>{' '}
                Finish the next steps to start using all Safe Account features:
              </Typography>
            )}
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
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
          </Grid>

          <Grid item xs={12} md={4}>
            {isActivating ? (
              <UsefulHintsWidget />
            ) : isMultiSig || isReplayedSafe ? (
              <ActivateSafeWidget chain={chain} />
            ) : (
              <FirstTransactionWidget completed={hasOutgoingTransactions} />
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <AccountReadyWidget />
          </Grid>
        </Grid>
      </WidgetBody>
    </WidgetContainer>
  )
}

export default FirstSteps

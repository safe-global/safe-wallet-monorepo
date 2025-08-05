import { useContext } from 'react'
import { Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material'
import CreatedIcon from '@/public/images/messages/created.svg'
import SignedIcon from '@/public/images/messages/signed.svg'
import { TransactionStatus, type TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isMultisigExecutionInfo, isSignableBy, isConfirmableBy } from '@/utils/transaction-guards'
import classnames from 'classnames'
import css from './styles.module.css'
import CloseIcon from '@mui/icons-material/Close'
import useWallet from '@/hooks/wallets/useWallet'
import SafeLogo from '@/public/images/logo-no-text.svg'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'

const TxStatusWidget = ({
  txSummary,
  handleClose,
  isBatch = false,
  isMessage = false,
  isLastStep = false,
}: {
  txSummary?: TransactionSummary
  handleClose: () => void
  isBatch?: boolean
  isMessage?: boolean
  isLastStep?: boolean
}) => {
  const wallet = useWallet()
  const { safe } = useSafeInfo()
  const { nonceNeeded } = useContext(SafeTxContext)
  const { threshold } = safe
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const isProposing = isProposer && !isSafeOwner
  const isAwaitingExecution = txSummary?.txStatus === TransactionStatus.AWAITING_EXECUTION

  const { executionInfo = undefined } = txSummary || {}
  const { confirmationsSubmitted = 0 } = isMultisigExecutionInfo(executionInfo) ? executionInfo : {}

  const canConfirm = txSummary
    ? isConfirmableBy(txSummary, wallet?.address || '')
    : safe.threshold === 1 && !isProposing

  const canSign = txSummary ? isSignableBy(txSummary, wallet?.address || '') : !isProposing

  return (
    <Paper>
      <div className={css.header}>
        <Typography fontWeight="700" display="flex" alignItems="center" gap={1}>
          <SafeLogo width={16} height={16} className={css.logo} />
          {isMessage ? 'Message' : 'Transaction'} status
        </Typography>

        <IconButton className={css.close} aria-label="close" onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </div>

      <Divider />

      <div className={css.content}>
        <List className={css.status}>
          <ListItem>
            <ListItemIcon>
              <CreatedIcon />
            </ListItemIcon>

            <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>
              {isBatch ? 'Queue transactions' : 'Create'}
            </ListItemText>
          </ListItem>

          <ListItem className={classnames({ [css.incomplete]: !canConfirm && !isBatch })}>
            <ListItemIcon>
              <SignedIcon />
            </ListItemIcon>

            <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>
              {isBatch ? (
                'Create batch'
              ) : !nonceNeeded ? (
                'Confirmed'
              ) : isMessage ? (
                'Collect signatures'
              ) : (
                <>
                  Confirmed ({confirmationsSubmitted} of {threshold})
                  {canSign && (
                    <Typography variant="body2" component="span" className={css.badge}>
                      +1
                    </Typography>
                  )}
                </>
              )}
            </ListItemText>
          </ListItem>

          <ListItem className={classnames({ [css.incomplete]: !(isAwaitingExecution && isLastStep) })}>
            <ListItemIcon>
              <SignedIcon />
            </ListItemIcon>

            <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>{isMessage ? 'Done' : 'Execute'}</ListItemText>
          </ListItem>
        </List>
      </div>
    </Paper>
  )
}

export default TxStatusWidget

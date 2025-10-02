import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { useContext } from 'react'
import { List, ListItem, ListItemIcon, ListItemText, Paper, Typography } from '@mui/material'
import CreatedIcon from '@/public/images/messages/created.svg'
import SignedIcon from '@/public/images/messages/signed.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isMultisigExecutionInfo, isSignableBy, isConfirmableBy } from '@/utils/transaction-guards'
import classnames from 'classnames'
import css from './styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'

const TxStatusWidget = ({
  txSummary,
  isBatch = false,
  isMessage = false,
  isLastStep = false,
}: {
  txSummary?: Transaction
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
    <Paper sx={{ backgroundColor: 'transparent' }}>
      <div className={css.content}>
        <List className={css.status}>
          <ListItem>
            <ListItemIcon>
              <CreatedIcon />
            </ListItemIcon>

            <ListItemText sx={{ letterSpacing: 1 }}>{isBatch ? 'Queue transactions' : 'Create'}</ListItemText>
          </ListItem>

          <ListItem className={classnames({ [css.incomplete]: !canConfirm && !isBatch })}>
            <ListItemIcon>
              <SignedIcon />
            </ListItemIcon>

            <ListItemText sx={{ letterSpacing: 1 }}>
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

            <ListItemText sx={{ letterSpacing: 1 }}>{isMessage ? 'Done' : 'Execute'}</ListItemText>
          </ListItem>
        </List>
      </div>
    </Paper>
  )
}

export default TxStatusWidget

import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { useContext, type ReactNode } from 'react'
import CreatedIcon from '@/public/images/messages/created.svg'
import SignedIcon from '@/public/images/messages/signed.svg'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isMultisigExecutionInfo, isSignableBy, isConfirmableBy } from '@/utils/transaction-guards'
import classnames from 'classnames'
import { cn } from '@/utils/cn'
import css from './styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'

const StatusLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('truncate text-xs leading-4 font-normal', className)}>{children}</span>
)

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
    <div className="bg-transparent">
      <ul className={css.status}>
        <li className={css.item}>
          <span className={css.itemIcon}>
            <CreatedIcon />
          </span>

          <StatusLabel>{isBatch ? 'Queue transactions' : 'Create'}</StatusLabel>
        </li>

        <li className={classnames(css.item, { [css.incomplete]: !canConfirm && !isBatch })}>
          <span className={css.itemIcon}>
            <SignedIcon />
          </span>

          <StatusLabel>
            {isBatch ? (
              'Create batch'
            ) : !nonceNeeded ? (
              'Confirmed'
            ) : isMessage ? (
              'Collect signatures'
            ) : (
              <>
                Confirmed ({confirmationsSubmitted} of {threshold}){canSign && <span className={css.badge}>+1</span>}
              </>
            )}
          </StatusLabel>
        </li>

        <li className={classnames(css.item, { [css.incomplete]: !(isAwaitingExecution && isLastStep) })}>
          <span className={css.itemIcon}>
            <SignedIcon />
          </span>

          <StatusLabel>{isMessage ? 'Done' : 'Execute'}</StatusLabel>
        </li>
      </ul>
    </div>
  )
}

export default TxStatusWidget

import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { useContext, type ReactNode } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isMultisigExecutionInfo, isSignableBy, isConfirmableBy } from '@/utils/transaction-guards'
import { Steps, type StepItem } from '@/components/common/Steps'
import css from './styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'

/* Between 900px and 1200px the rail collapses to icons only so the transaction card — the point of
   the screen — keeps its width instead of the header wrapping mid-word. `sr-only` rather than
   `hidden` so the step names stay in the accessibility tree at every width. Below 900px
   TxLayoutBase drops the rail entirely. */
const StatusLabel = ({ children }: { children: ReactNode }) => (
  <span className="text-xs leading-4 sr-only min-[1200px]:not-sr-only min-[1200px]:truncate">{children}</span>
)

const TxStatusWidget = ({
  txSummary,
  isBatch = false,
  isMessage = false,
  isLastStep = false,
  reviewStepDone,
}: {
  txSummary?: Transaction
  isBatch?: boolean
  isMessage?: boolean
  isLastStep?: boolean
  /** Undefined for flows that have no review step of their own — the cell is then not rendered. */
  reviewStepDone?: boolean
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

  const items: StepItem[] = [
    { id: 'create', label: <StatusLabel>{isBatch ? 'Queue transactions' : 'Create'}</StatusLabel>, done: true },

    ...(reviewStepDone === undefined
      ? []
      : [{ id: 'review', label: <StatusLabel>Review</StatusLabel>, done: reviewStepDone }]),

    {
      id: 'confirm',
      label: (
        <StatusLabel>
          {isBatch ? (
            'Create batch'
          ) : !nonceNeeded ? (
            'Confirmed'
          ) : isMessage ? (
            'Collect signatures'
          ) : (
            <>
              Confirm ({confirmationsSubmitted} of {threshold}){canSign && <span className={css.badge}>+1</span>}
            </>
          )}
        </StatusLabel>
      ),
      done: canConfirm || isBatch,
    },

    {
      id: 'execute',
      label: <StatusLabel>{isMessage ? 'Done' : 'Execute'}</StatusLabel>,
      done: isAwaitingExecution && isLastStep,
    },
  ]

  return <Steps items={items} />
}

export default TxStatusWidget

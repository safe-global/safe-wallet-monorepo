import { useContext } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

import CheckWallet from '@/components/common/CheckWallet'
import { useRecoveryTxState } from '../../hooks/useRecoveryTxState'
import type { RecoveryQueueItem } from '../../services/recovery-state'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import { useCurrentChain } from '@/hooks/useChains'
import { TxModalContext } from '@/components/tx-flow'
import { RecoveryAttemptFlow } from '@/components/tx-flow/flows'
import { ExecuteRecoveryButtonView } from '@views/features/recovery/components/ExecuteRecoveryButton/ExecuteRecoveryButtonView'

export default function ExecuteRecoveryButton({
  recovery,
  compact = false,
}: {
  recovery: RecoveryQueueItem
  compact?: boolean
}): ReactElement {
  const { isExecutable, isNext, isPending } = useRecoveryTxState(recovery)
  const isDisabled = !isExecutable || isPending
  const isWrongChain = useIsWrongChain()
  const chain = useCurrentChain()
  const { setTxFlow } = useContext(TxModalContext)

  const onClick = async (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()

    setTxFlow(<RecoveryAttemptFlow item={recovery} />)
  }

  return (
    <ExecuteRecoveryButtonView
      isWrongChain={isWrongChain}
      chainName={chain?.chainName}
      isDisabled={isDisabled}
      isNext={isNext}
      compact={compact}
      onClick={onClick}
      renderCheckWallet={(children) => (
        <CheckWallet allowNonOwner checkNetwork={!isDisabled}>
          {children}
        </CheckWallet>
      )}
    />
  )
}

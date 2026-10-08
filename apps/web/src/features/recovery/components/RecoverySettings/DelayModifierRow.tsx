import { useContext } from 'react'
import type { ReactElement } from 'react'

import { TxModalContext } from '@/components/tx-flow'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import CheckWallet from '@/components/common/CheckWallet'
import { RemoveRecoveryFlow, UpsertRecoveryFlow } from '@/components/tx-flow/flows'
import type { RecoveryStateItem } from '../../services/recovery-state'
import { DelayModifierRowView } from '@views/features/recovery/components/RecoverySettings/DelayModifierRowView'

export function DelayModifierRow({ delayModifier }: { delayModifier: RecoveryStateItem }): ReactElement | null {
  const { setTxFlow } = useContext(TxModalContext)
  const isOwner = useIsSafeOwner()

  if (!isOwner) {
    return null
  }

  const onEdit = () => {
    setTxFlow(<UpsertRecoveryFlow delayModifier={delayModifier} />)
  }

  const onDelete = () => {
    setTxFlow(<RemoveRecoveryFlow delayModifier={delayModifier} />)
  }

  return (
    <DelayModifierRowView
      onEdit={onEdit}
      onDelete={onDelete}
      renderCheckWallet={(children) => <CheckWallet>{children}</CheckWallet>}
    />
  )
}

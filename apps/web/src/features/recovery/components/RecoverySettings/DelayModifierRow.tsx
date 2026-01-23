import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { IconButton, SvgIcon, Tooltip } from '@mui/material'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import { TxModalContext } from '@/features/tx-flow'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditIcon from '@/public/images/common/edit.svg'
import CheckWallet from '@/components/common/CheckWallet'
import { RemoveRecoveryFlow, UpsertRecoveryFlow } from '@/features/tx-flow'
import type { RecoveryStateItem } from '@/features/recovery/services/recovery-state'

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
    <CheckWallet>
      {(isOk) => (
        <>
          <Tooltip title={isOk ? 'Edit recovery setup' : undefined}>
            <span>
              <Track {...RECOVERY_EVENTS.EDIT_RECOVERY}>
                <IconButton data-testid="edit-recoverer-btn" onClick={onEdit} size="small" disabled={!isOk}>
                  <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
                </IconButton>
              </Track>
            </span>
          </Tooltip>

          <Tooltip title={isOk ? 'Remove recovery' : undefined}>
            <span>
              <Track {...RECOVERY_EVENTS.REMOVE_RECOVERY}>
                <IconButton data-testid="remove-recoverer-btn" onClick={onDelete} size="small" disabled={!isOk}>
                  <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
                </IconButton>
              </Track>
            </span>
          </Tooltip>
        </>
      )}
    </CheckWallet>
  )
}

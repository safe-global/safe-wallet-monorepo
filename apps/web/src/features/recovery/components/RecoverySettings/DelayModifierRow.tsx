import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TxModalContext } from '@/components/tx-flow'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditIcon from '@/public/images/common/edit.svg'
import CheckWallet from '@/components/common/CheckWallet'
import { RemoveRecoveryFlow, UpsertRecoveryFlow } from '@/components/tx-flow/flows'
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
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Track {...RECOVERY_EVENTS.EDIT_RECOVERY}>
                <Button
                  data-testid="edit-recoverer-btn"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onEdit}
                  disabled={!isOk}
                >
                  <EditIcon className="size-4 fill-current text-[var(--color-border-main)]" />
                </Button>
              </Track>
            </TooltipTrigger>
            {isOk && <TooltipContent>Edit recovery setup</TooltipContent>}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Track {...RECOVERY_EVENTS.REMOVE_RECOVERY}>
                <Button
                  data-testid="remove-recoverer-btn"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDelete}
                  disabled={!isOk}
                >
                  <DeleteIcon className="size-4 fill-current text-[var(--color-error-main)]" />
                </Button>
              </Track>
            </TooltipTrigger>
            {isOk && <TooltipContent>Remove recovery</TooltipContent>}
          </Tooltip>
        </>
      )}
    </CheckWallet>
  )
}

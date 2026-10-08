import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import type { ReactElement, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import DeleteIcon from '@/public/images/common/delete.svg'
import EditIcon from '@/public/images/common/edit.svg'

export type DelayModifierRowViewProps = {
  onEdit: () => void
  onDelete: () => void
  renderCheckWallet: (children: (isOk: boolean) => ReactElement) => ReactNode
}

export function DelayModifierRowView({ onEdit, onDelete, renderCheckWallet }: DelayModifierRowViewProps): ReactElement {
  return (
    <>
      {renderCheckWallet((isOk) => (
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
      ))}
    </>
  )
}

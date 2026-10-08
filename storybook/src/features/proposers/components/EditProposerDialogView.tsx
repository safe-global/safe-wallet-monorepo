import type { ReactNode } from 'react'
import Track from '@/components/common/Track'
import EditIcon from '@/public/images/common/edit.svg'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type EditProposerDialogViewProps = {
  onOpen: () => void
  dialog: ReactNode
}

export const EditProposerDialogView = ({ onOpen, dialog }: EditProposerDialogViewProps) => {
  return (
    <>
      <Track {...SETTINGS_EVENTS.PROPOSERS.EDIT_PROPOSER}>
        <Tooltip>
          <TooltipTrigger
            render={
              <span tabIndex={0}>
                <Button variant="ghost" size="icon-sm" data-testid="edit-proposer-btn" onClick={onOpen}>
                  <EditIcon className="size-4 text-[var(--color-border-main)]" />
                </Button>
              </span>
            }
          />
          <TooltipContent>Rename proposer</TooltipContent>
        </Tooltip>
      </Track>

      {dialog}
    </>
  )
}

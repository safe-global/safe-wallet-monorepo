import { XIcon } from 'lucide-react'
import WarningIcon from '@/public/images/notifications/warning.svg'
import type { ReactElement, SyntheticEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import Track from '@/components/common/Track'

import css from './styles.module.css'

export type ConfirmCopyModalViewProps = {
  open: boolean
  onClose: () => void
  onCopy: (e: SyntheticEvent) => void
  children: ReactElement
}

export function ConfirmCopyModalView({ open, onClose, onCopy, children }: ConfirmCopyModalViewProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogTitle render={<div />} className="p-4">
          <div data-testid="untrusted-token-warning" className="flex flex-row items-center gap-2">
            <WarningIcon className="-mb-0.5 size-6 text-[var(--color-warning-main)]" />
            <Typography variant="h4" className="font-bold">
              Before you copy
            </Typography>
            <Button variant="ghost" size="icon-sm" aria-label="close" onClick={onClose} className="ml-auto">
              <XIcon />
            </Button>
          </div>
        </DialogTitle>
        <Separator />
        <div className="p-4">{children}</div>
        <Separator />
        <div className="p-6">
          <div className={css.dialogActions + ' gap-2'}>
            <Track {...TX_LIST_EVENTS.COPY_WARNING_PROCEED}>
              <Button variant="ghost" size="sm" onClick={onCopy} className="w-full">
                Proceed and copy
              </Button>
            </Track>
            <Track {...TX_LIST_EVENTS.COPY_WARNING_CLOSE}>
              <Button variant="default" size="sm" onClick={onClose} className="w-full">
                Do not copy
              </Button>
            </Track>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { type ReactNode } from 'react'

export type HnModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

const HnModal = ({ open, onClose, children }: HnModalProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent
        size="md"
        surface="paper"
        padding="none"
        // eslint-disable-next-line no-restricted-syntax -- rounded-2xl: bespoke 16px radius, no dialog radius token
        className="overflow-auto rounded-2xl"
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default HnModal

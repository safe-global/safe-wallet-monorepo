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
      <DialogContent className="max-w-[900px] overflow-auto rounded-2xl bg-[var(--color-background-paper)] p-0">
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default HnModal

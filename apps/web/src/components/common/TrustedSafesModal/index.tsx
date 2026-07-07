import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ManageTrustedSafesContent from './ManageTrustedSafesContent'
import type { UseTrustedSafesModalReturn } from './useTrustedSafesModal'

interface TrustedSafesModalProps {
  modal: UseTrustedSafesModalReturn
}

const TrustedSafesModal = ({ modal }: TrustedSafesModalProps) => {
  return (
    <Dialog open={modal.isOpen} onOpenChange={(open) => !open && modal.close()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-[min(900px,calc(100vw-2rem))] flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 pb-4 pt-6">
          <DialogTitle className="font-bold">Manage trusted Safes</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
          <ManageTrustedSafesContent modal={modal} secondaryLabel="Cancel" onSecondary={modal.close} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TrustedSafesModal

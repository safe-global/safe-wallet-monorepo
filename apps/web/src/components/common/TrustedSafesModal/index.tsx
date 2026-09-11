import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ManageTrustedSafesContent from './ManageTrustedSafesContent'
import type { UseTrustedSafesModalReturn } from './useTrustedSafesModal'

interface TrustedSafesModalProps {
  modal: UseTrustedSafesModalReturn
}

const TrustedSafesModal = ({ modal }: TrustedSafesModalProps) => {
  return (
    <Dialog open={modal.isOpen} onOpenChange={(open) => !open && modal.close()}>
      <DialogContent
        padding="none"
        // eslint-disable-next-line no-restricted-syntax -- responsive max-w-[min(900px,calc(100vw-2rem))]: not a size token (needs design)
        className="flex max-h-[90vh] max-w-[min(900px,calc(100vw-2rem))] flex-col"
      >
        <DialogHeader
          divided
          // eslint-disable-next-line no-restricted-syntax -- bespoke header padding px-6 pb-4 pt-6, no token
          className="shrink-0 px-6 pb-4 pt-6"
        >
          <DialogTitle className="font-bold">Manage my account list</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
          <ManageTrustedSafesContent modal={modal} secondaryLabel="Cancel" onSecondary={modal.close} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TrustedSafesModal

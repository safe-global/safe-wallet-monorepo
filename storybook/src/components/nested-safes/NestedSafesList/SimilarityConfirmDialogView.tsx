import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { ReactElement, ReactNode } from 'react'

export type SimilarityConfirmDialogViewProps = {
  address: string
  similarAddresses: string[]
  onConfirm: () => void
  onCancel: () => void
  renderAddress: (address: string) => ReactNode
}

export function SimilarityConfirmDialogView({
  address,
  similarAddresses,
  onConfirm,
  onCancel,
  renderAddress,
}: SimilarityConfirmDialogViewProps): ReactElement {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <DialogContent data-testid="similarity-confirm-dialog" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="font-bold">Similar address detected</DialogTitle>
        </DialogHeader>
        <div className="px-4">
          <Typography variant="paragraph-small" color="muted" className="block mb-4">
            This address looks similar to other addresses in your list. This could be a sign of an address poisoning
            attack where attackers create addresses that visually resemble legitimate ones.
          </Typography>

          <div className="mb-4">
            <Typography variant="paragraph-small-medium" className="mb-2 block">
              Selected address:
            </Typography>
            {renderAddress(address)}
          </div>

          {similarAddresses.length > 0 && (
            <div>
              <Typography variant="paragraph-small-medium" className="mb-2 block">
                Similar {similarAddresses.length === 1 ? 'address' : 'addresses'}:
              </Typography>
              {similarAddresses.map((addr) => (
                <div key={addr} className="mb-2">
                  {renderAddress(addr)}
                </div>
              ))}
            </div>
          )}

          <Typography variant="paragraph-small-medium" className="mt-4 block text-[var(--color-warning-main)]">
            Please verify this is the correct address before proceeding.
          </Typography>
        </div>
        <div className="flex justify-between gap-2 p-4 pt-0 pb-6">
          <Button variant="outline" onClick={onCancel} data-testid="similarity-cancel-button">
            Cancel
          </Button>
          <Button onClick={onConfirm} data-testid="similarity-confirm-button">
            I understand, proceed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

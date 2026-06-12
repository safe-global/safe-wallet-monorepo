import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { List, ListItem } from '@/components/ui/list'
import { TriangleAlertIcon } from 'lucide-react'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { SelectableItem } from '../../hooks/useSafeSelectionModal.types'

interface SelectAllConfirmDialogProps {
  open: boolean
  similarAddresses: SelectableItem[]
  onConfirm: () => void
  onCancel: () => void
}

const SelectAllConfirmDialog = ({ open, similarAddresses, onConfirm, onCancel }: SelectAllConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Similar addresses detected</DialogTitle>
        </DialogHeader>

        <div className="px-4">
          <Alert variant="warning" className="mb-4">
            <AlertDescription>
              {similarAddresses.length} Safe{similarAddresses.length === 1 ? '' : 's'} in your list closely resemble
              other addresses. Review them carefully before continuing.
            </AlertDescription>
          </Alert>

          <Typography variant="paragraph-small" color="muted" className="mb-4 block">
            The following addresses have been flagged as similar:
          </Typography>

          <List className="bg-background border-border max-h-[200px] overflow-auto rounded-md border">
            {similarAddresses.map((item) => (
              <ListItem key={item.address} className="py-2">
                <div className="w-full">
                  <EthHashInfo address={item.address} showCopyButton shortAddress={false} showAvatar avatarSize={24} />
                  {item.name && (
                    <Typography variant="paragraph-mini" color="muted">
                      {item.name}
                    </Typography>
                  )}
                </div>
              </ListItem>
            ))}
          </List>

          <Typography variant="paragraph-small" color="muted" className="mt-4 block">
            Do you want to include these addresses in your selection?
          </Typography>
        </div>

        <DialogFooter className="flex-row justify-end">
          <DialogClose render={<Button variant="outline" />}>No, skip similar addresses</DialogClose>
          <Button onClick={onConfirm}>
            <TriangleAlertIcon className="size-4" />
            Yes, include them anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SelectAllConfirmDialog

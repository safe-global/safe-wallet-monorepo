import { CirclePlus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChooserRow } from '@/components/common/ChooserRow'

export type AddAccountsChooserViewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectExisting: () => void
  onCreate: () => void
  buttonVariant?: 'outline' | 'secondary' | 'default'
  buttonClassName?: string
}

export const AddAccountsChooserView = ({
  open,
  onOpenChange,
  onSelectExisting,
  onCreate,
  buttonVariant = 'outline',
  buttonClassName,
}: AddAccountsChooserViewProps) => {
  return (
    <>
      <Button
        variant={buttonVariant}
        className={buttonClassName}
        onClick={() => onOpenChange(true)}
        data-testid="open-add-accounts-chooser-button"
      >
        <Plus className="size-4" />
        Add accounts
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* eslint-disable-next-line no-restricted-syntax -- bespoke dialog width/padding preserved from dev's #8271 redesign; candidate for a Dialog size/padding variant later */}
        <DialogContent showCloseButton className="max-w-[440px] p-6 dark:border dark:border-border">
          {/* eslint-disable-next-line no-restricted-syntax -- bespoke header padding preserved from dev's #8271 redesign */}
          <DialogHeader className="p-0 pb-3">
            <DialogTitle className="font-bold">Add Safe accounts</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <ChooserRow
              icon={<Plus className="size-4" />}
              title="Select existing"
              onClick={onSelectExisting}
              testId="add-accounts-select-existing"
            />
            <ChooserRow
              icon={<CirclePlus className="size-4" />}
              title="Create new"
              onClick={onCreate}
              testId="add-accounts-create-new"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

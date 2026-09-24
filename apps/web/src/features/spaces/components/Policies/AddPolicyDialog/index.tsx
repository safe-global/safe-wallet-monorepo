import { type ReactElement } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'
import AddPolicyOptionButton from './AddPolicyOptionButton'
import { ADD_POLICY_OPTIONS, type AddPolicyId, type AddPolicyOption } from './options'

const SINGLE_COLUMN_MAX = 3

export interface AddPolicyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect?: (id: AddPolicyId) => void
  options?: AddPolicyOption[]
}

const AddPolicyDialog = ({
  open,
  onOpenChange,
  onSelect,
  options = ADD_POLICY_OPTIONS,
}: AddPolicyDialogProps): ReactElement => {
  const isTwoColumn = options.length > SINGLE_COLUMN_MAX

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={isTwoColumn ? 'sm' : 'xs'} data-testid="add-policy-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl leading-6 font-semibold">Add policy</DialogTitle>
        </DialogHeader>

        <div
          data-testid="add-policy-options"
          className={cn('grid gap-3 px-4 pb-4', {
            'sm:grid-cols-2': isTwoColumn,
          })}
        >
          {options.map((option) => (
            <AddPolicyOptionButton key={option.id} {...option} onClick={() => onSelect?.(option.id)} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddPolicyDialog

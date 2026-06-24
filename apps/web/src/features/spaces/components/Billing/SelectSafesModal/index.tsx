import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import SafeSearch from '../../SelectSafeModal/SafeSearch'
import SelectableSafeRow from './SelectableSafeRow'
import { useSelectSafes } from './useSelectSafes'

interface SelectSafesModalProps {
  open: boolean
  onClose: () => void
  /** Addresses currently included in the plan; pre-checks their rows. */
  initialSelected: string[]
  onSave: (addresses: string[]) => void
}

const SelectSafesModal = ({ open, onClose, initialSelected, onSave }: SelectSafesModalProps) => {
  const {
    isLoading,
    query,
    setQuery,
    displayed,
    isSelected,
    toggle,
    allSelected,
    someSelected,
    toggleAll,
    selectedAddresses,
  } = useSelectSafes(open, initialSelected)

  const handleSave = () => {
    onSave(selectedAddresses())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-[560px] flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 px-6 pb-2 pt-6">
          <DialogTitle className="text-[24px] font-semibold leading-[28.8px] tracking-[-1px] text-foreground">
            Select Safes for your plan
          </DialogTitle>
          <DialogDescription className="text-base font-normal leading-6 text-muted-foreground">
            Choose which safes you want to include in this plan. You can add more later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 items-center gap-3 px-6 py-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={someSelected ? 'mixed' : allSelected}
            aria-label="Select all safes"
            onClick={toggleAll}
            disabled={displayed.length === 0}
            className="flex cursor-pointer items-center"
          >
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none"
            />
          </button>
          <div className="flex-1">
            <SafeSearch value={query} onChange={setQuery} />
          </div>
        </div>

        <div className="flex max-h-[336px] min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-6 pb-2">
          {isLoading ? (
            <>
              <Skeleton className="h-[60px] w-full rounded-2xl" />
              <Skeleton className="h-[60px] w-full rounded-2xl" />
              <Skeleton className="h-[60px] w-full rounded-2xl" />
            </>
          ) : displayed.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No safes found</p>
          ) : (
            displayed.map((safe) => (
              <SelectableSafeRow
                key={safe.address}
                safe={safe}
                checked={isSelected(safe.address)}
                onToggle={() => toggle(safe.address)}
              />
            ))
          )}
        </div>

        <DialogFooter className="shrink-0 px-6 pb-6 pt-4">
          <Button className="w-full" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SelectSafesModal

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
import css from './styles.module.css'

interface SelectSafesModalProps {
  open: boolean
  onClose: () => void
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
      <DialogContent className={css.content}>
        <DialogHeader className={css.header}>
          <DialogTitle className={css.title}>Select Safes for your plan</DialogTitle>
          <DialogDescription className={css.description}>
            Choose which safes you want to include in this plan. You can add more later.
          </DialogDescription>
        </DialogHeader>

        <div className={css.toolbar}>
          <button
            type="button"
            role="checkbox"
            aria-checked={someSelected ? 'mixed' : allSelected}
            aria-label="Select all safes"
            onClick={toggleAll}
            disabled={displayed.length === 0}
            className={css.selectAll}
          >
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              tabIndex={-1}
              aria-hidden
              className={css.checkbox}
            />
          </button>
          <div className={css.search}>
            <SafeSearch value={query} onChange={setQuery} />
          </div>
        </div>

        <div className={css.list}>
          {isLoading ? (
            Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className={css.skeleton} />)
          ) : displayed.length === 0 ? (
            <p className={css.empty}>No safes found</p>
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

        <DialogFooter className={css.footer}>
          <Button className={css.saveButton} onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SelectSafesModal

import { useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Field, FieldLabel, FieldLegend, FieldSet } from '@safe-global/views/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@safe-global/views/components/ui/radio-group'
import { Typography } from '@safe-global/views/components/ui/typography'

export type ExportScope = 'all' | 'current-view' | 'selected'

type ExportDialogProps = {
  counts: Record<ExportScope, number>
  initialScope?: ExportScope
  onExport: (scope: ExportScope) => void
  onClose: () => void
}

const SCOPES: { value: ExportScope; label: string }[] = [
  { value: 'all', label: 'All contacts' },
  { value: 'current-view', label: 'Current view' },
  { value: 'selected', label: 'Selected' },
]

/** CSV only: address, name and chain, one row per chain. The scope picks which contacts. */
const ExportDialog = ({ counts, initialScope = 'all', onExport, onClose }: ExportDialogProps) => {
  const [scope, setScope] = useState<ExportScope>(
    initialScope === 'selected' && counts.selected === 0 ? 'all' : initialScope,
  )
  const count = counts[scope]

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent padding="none">
        <DialogHeader divided>
          <DialogTitle className="text-xl font-bold">Export address book</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 p-6">
          <FieldSet>
            <FieldLegend variant="label">Contacts</FieldLegend>
            <RadioGroup value={scope} onValueChange={(value) => setScope(value as ExportScope)} aria-label="Contacts">
              {SCOPES.map((option) => (
                <Field key={option.value} orientation="horizontal">
                  <RadioGroupItem
                    value={option.value}
                    id={`export-scope-${option.value}`}
                    disabled={counts[option.value] === 0}
                  />
                  <FieldLabel htmlFor={`export-scope-${option.value}`}>
                    {option.label} <span className="text-muted-foreground">({counts[option.value]})</span>
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </FieldSet>

          <Typography variant="paragraph-small" className="text-muted-foreground">
            Exports a CSV file with the address, name and chain of each contact, one row per chain. You can import it
            into any address book.
          </Typography>
        </div>

        <DialogFooter divided className="flex-row items-center justify-between">
          <Button variant="outline" size="submit" onClick={onClose}>
            Cancel
          </Button>
          <Button size="submit" disabled={count === 0} onClick={() => onExport(scope)} data-testid="export-btn">
            Export {count} {count === 1 ? 'contact' : 'contacts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportDialog

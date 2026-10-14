import { Download, X } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import TagPicker from './tags/TagPicker'
import { commonTags, hasTag } from './tags/tagRules'
import type { AddressBookContact, TagCount } from './types'

type BulkActionBarProps = {
  selected: AddressBookContact[]
  tagOptions: TagCount[]
  canEditTags: boolean
  /** Tags ticked in the picker are added to every selected contact; unticked ones are removed from all. */
  onTagsChange: (change: { added: string[]; removed: string[] }) => void
  onExportSelected: () => void
  onClear: () => void
}

/** Shown above the table while rows are selected. */
const BulkActionBar = ({
  selected,
  tagOptions,
  canEditTags,
  onTagsChange,
  onExportSelected,
  onClear,
}: BulkActionBarProps) => {
  if (selected.length === 0) return null
  const shared = commonTags(selected.map((contact) => contact.tags))

  const handleTags = (next: string[]) => {
    const added = next.filter((tag) => !hasTag(shared, tag))
    const removed = shared.filter((tag) => !hasTag(next, tag))
    if (added.length > 0 || removed.length > 0) onTagsChange({ added, removed })
  }

  return (
    <div
      className="bg-muted/40 border-border flex flex-wrap items-center gap-2 rounded-md border px-3 py-1.5"
      role="region"
      aria-label="Bulk actions"
      data-testid="bulk-action-bar"
    >
      <Typography variant="paragraph-small-medium" className="mr-1">
        {selected.length} selected
      </Typography>
      {canEditTags && <TagPicker value={shared} onChange={handleTags} options={tagOptions} label="Tags" />}
      <Button variant="outline" size="sm" onClick={onExportSelected}>
        <Download aria-hidden="true" data-icon="inline-start" />
        Export selected
      </Button>
      <Button variant="ghost" size="sm" className="ml-auto" onClick={onClear}>
        <X aria-hidden="true" data-icon="inline-start" />
        Clear selection
      </Button>
    </div>
  )
}

export default BulkActionBar

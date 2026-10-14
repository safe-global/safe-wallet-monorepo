import { useState } from 'react'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Typography } from '@safe-global/views/components/ui/typography'
import GroupedAddress from '../GroupedAddress'
import TagPicker from '../tags/TagPicker'
import { TagChips } from '../tags/TagChip'
import { TAGS_DISCLAIMER, hasTag } from '../tags/tagRules'
import type { AddressBookContact, TagCount } from '../types'

type EditTagsDialogProps = {
  contact: Pick<AddressBookContact, 'name' | 'address' | 'tags'>
  tagOptions: TagCount[]
  onSave: (tags: string[]) => void
  onClose: () => void
  isSubmitting?: boolean
}

const sameTags = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((tag) => hasTag(b, tag))

/** Tag editing for every active member. Name, address and chains are shown, never changed. */
const EditTagsDialog = ({ contact, tagOptions, onSave, onClose, isSubmitting = false }: EditTagsDialogProps) => {
  const [tags, setTags] = useState<string[]>(contact.tags)

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent padding="none">
        <DialogHeader divided>
          <DialogTitle className="text-xl font-bold">Edit tags</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <Typography variant="paragraph-bold">{contact.name}</Typography>
            <GroupedAddress address={contact.address} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TagPicker value={tags} onChange={setTags} options={tagOptions} showCounts={false} />
            <TagChips tags={tags} maxVisible={10} />
          </div>
          <Typography variant="paragraph-small" className="text-muted-foreground">
            {TAGS_DISCLAIMER}
          </Typography>
        </div>
        <DialogFooter divided className="flex-row items-center justify-between">
          <Button variant="outline" size="submit" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="submit"
            onClick={() => onSave(tags)}
            disabled={sameTags(tags, contact.tags) || isSubmitting}
            data-testid="save-tags-btn"
          >
            {isSubmitting ? <Spinner /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditTagsDialog

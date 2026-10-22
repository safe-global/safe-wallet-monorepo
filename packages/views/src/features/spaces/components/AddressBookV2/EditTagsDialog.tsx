import { useState } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Button } from '@safe-global/views/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { Typography } from '@safe-global/views/components/ui/typography'
import GroupedAddress from './GroupedAddress'
import TagSelect, { type TagActions } from './tags/TagSelect'
import { TAGS_DISCLAIMER } from './tags/tagRules'
import type { WorkspaceTag } from './types'

type EditTagsDialogProps = {
  contact: { name: string; address: string; tagIds: number[] }
  workspaceTags: WorkspaceTag[]
  onSave: (tagIds: number[]) => void
  onClose: () => void
  onLimitReached?: () => void
  /** Create, rename and delete from the picker; they apply at once, not on save. */
  tagActions?: TagActions
  isSubmitting?: boolean
  error?: string
}

/** Tag editing for every active member. Name, address and chains are shown, never changed. */
const EditTagsDialog = ({
  contact,
  workspaceTags,
  onSave,
  onClose,
  onLimitReached,
  tagActions,
  isSubmitting = false,
  error,
}: EditTagsDialogProps) => {
  const [tagIds, setTagIds] = useState<number[]>(contact.tagIds)
  const existing = (ids: number[]) => ids.filter((id) => workspaceTags.some((tag) => tag.id === id))
  const selected = existing(tagIds)
  const saved = existing(contact.tagIds)
  const isUnchanged = selected.length === saved.length && selected.every((id) => saved.includes(id))

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
          <TagSelect
            mode="assign"
            tags={workspaceTags}
            value={tagIds}
            onChange={setTagIds}
            actions={tagActions}
            onLimitReached={onLimitReached}
          />
          <Typography variant="paragraph-small" className="text-muted-foreground">
            {TAGS_DISCLAIMER}
          </Typography>
          {error && (
            <Alert variant="destructive">
              <AlertSeverityIcon variant="destructive" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter divided className="flex-row items-center justify-between">
          <Button variant="outline" size="submit" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="submit"
            onClick={() => onSave(selected)}
            disabled={isUnchanged || isSubmitting}
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

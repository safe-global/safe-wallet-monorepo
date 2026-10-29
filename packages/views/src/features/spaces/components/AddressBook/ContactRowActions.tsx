import { EllipsisVertical, Pencil, Tag, Trash2 } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'
import type { AddressBookPermissions } from './types'

type ContactRowActionsProps = {
  name: string
  permissions: Pick<AddressBookPermissions, 'canEdit' | 'canEditTags' | 'canDelete'>
  onEdit?: () => void
  onEditTags?: () => void
  onDelete?: () => void
}

/** Row actions behind one three-dot menu. Renders nothing when the member may do none of them. */
const ContactRowActions = ({ name, permissions, onEdit, onEditTags, onDelete }: ContactRowActionsProps) => {
  const { canEdit, canEditTags, canDelete } = permissions
  if (!canEdit && !canEditTags && !canDelete) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost-muted" size="icon-sm" aria-label={`Actions for ${name}`}>
            <EllipsisVertical />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil />
            Edit contact
          </DropdownMenuItem>
        )}
        {canEditTags && (
          <DropdownMenuItem onClick={onEditTags}>
            <Tag />
            Edit tags
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 />
            Delete contact
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ContactRowActions

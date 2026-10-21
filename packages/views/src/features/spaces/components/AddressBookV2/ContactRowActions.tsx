import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@safe-global/views/components/ui/dropdown-menu'

type ContactRowActionsProps = {
  name: string
  onEdit?: () => void
  onDelete?: () => void
}

const ContactRowActions = ({ name, onEdit, onDelete }: ContactRowActionsProps) => {
  if (!onEdit && !onDelete) return null

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
        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil />
            Edit contact
          </DropdownMenuItem>
        )}
        {onDelete && (
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

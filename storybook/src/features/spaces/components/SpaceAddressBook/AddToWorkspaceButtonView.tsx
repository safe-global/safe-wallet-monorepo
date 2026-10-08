import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, Plus } from 'lucide-react'
import InvalidContactNameTooltip from './InvalidContactNameTooltip'
import { Spinner } from '@/components/ui/spinner'

export type AddToWorkspaceButtonViewProps = {
  added: boolean
  isSubmitting: boolean
  nameError?: string
  isCompact?: boolean
  onAdd: () => void
}

export const AddToWorkspaceButtonView = ({
  added,
  isSubmitting,
  nameError,
  isCompact,
  onAdd,
}: AddToWorkspaceButtonViewProps) => {
  const label = added ? 'Added' : 'Add to Workspace'
  const icon = added ? <Check className="size-4" /> : <Plus className="size-4" />

  // Compact has no room for the label, so it moves into the accessible name and a tooltip
  const button = (
    <Button
      variant="outline"
      size={isCompact ? 'icon-sm' : 'sm'}
      aria-label={isCompact ? label : undefined}
      onClick={onAdd}
      disabled={isSubmitting || added || !!nameError}
    >
      {isSubmitting ? <Spinner className="size-3.5" /> : isCompact ? icon : label}
    </Button>
  )

  if (nameError) {
    return <InvalidContactNameTooltip nameError={nameError}>{button}</InvalidContactNameTooltip>
  }

  if (!isCompact) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

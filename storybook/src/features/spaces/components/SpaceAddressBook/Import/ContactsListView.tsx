import type { ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getRenameContactTooltip } from '@/features/spaces/components/SpaceAddressBook/utils'
import { cn } from '@/utils/cn'

export const ContactsListView = ({ children }: { children: ReactNode }) => (
  <ul className="flex flex-col gap-2 mt-2 px-4 pb-4 pt-0 h-[400px] overflow-auto">{children}</ul>
)

export type ContactRowViewProps = {
  isSelected: boolean
  alreadyAdded: boolean
  nameError?: string
  disabled: boolean
  onToggle: () => void
  onSelectedChange: (next: boolean) => void
  addressInfo: ReactNode
  chainLogo: ReactNode
}

export const ContactRowView = ({
  isSelected,
  alreadyAdded,
  nameError,
  disabled,
  onToggle,
  onSelectedChange,
  addressInfo,
  chainLogo,
}: ContactRowViewProps) => {
  const row = (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted',
      )}
    >
      <Checkbox
        // alreadyAdded contacts show as ticked to indicate they're already in the space, even though the form value is undefined
        checked={isSelected || alreadyAdded}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={(checked) => onSelectedChange(Boolean(checked))}
      />
      <div className="flex-1 flex items-center justify-between overflow-hidden">
        <div className="overflow-auto">{addressInfo}</div>
        {chainLogo}
      </div>
    </div>
  )

  return (
    <li>
      {disabled ? (
        <Tooltip>
          <TooltipTrigger render={<div />} className="block w-full">
            {row}
          </TooltipTrigger>
          <TooltipContent>
            {nameError
              ? getRenameContactTooltip(nameError)
              : alreadyAdded
                ? 'You already added a contact with this address.'
                : 'You already selected a contact with this address.'}
          </TooltipContent>
        </Tooltip>
      ) : (
        row
      )}
    </li>
  )
}

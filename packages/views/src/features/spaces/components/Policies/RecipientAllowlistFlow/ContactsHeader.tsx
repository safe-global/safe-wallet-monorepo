import type { ReactElement } from 'react'
import { Building2, HardDrive, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import {
  FALLBACK_SPACE_NAME,
  getSpaceContactsTooltip,
  LOCAL_CONTACTS_LABEL,
  LOCAL_CONTACTS_TOOLTIP,
  SPACE_CONTACTS_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

export type ContactsSource = 'workspace' | 'local'

type ContactsHeaderProps = {
  source: ContactsSource
  workspaceName?: string
  count: number
}

/** The header bar over one address book's contacts in a picker list. */
const ContactsHeader = ({ source, workspaceName, count }: ContactsHeaderProps): ReactElement => {
  const isWorkspace = source === 'workspace'
  const Icon = isWorkspace ? Building2 : HardDrive

  return (
    // Sticky over a card-coloured strip, so rows scrolling under it don't show through the inset around the bar
    <div className="sticky top-0 z-10 bg-card pb-1" data-testid={`contacts-header-${source}`}>
      <div className="flex h-10 items-center gap-1.5 rounded-lg bg-muted px-4 text-xs leading-4 font-semibold text-muted-foreground uppercase">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="flex min-w-0 items-center gap-1 truncate">
          {isWorkspace ? (
            <>
              {SPACE_CONTACTS_LABEL}
              {workspaceName ? (
                // A pill, not plain text: a crafted Workspace name can't pass for UI copy
                <span className="truncate rounded border border-border bg-background px-1 normal-case">
                  {workspaceName}
                </span>
              ) : (
                ` ${FALLBACK_SPACE_NAME}`
              )}
            </>
          ) : (
            LOCAL_CONTACTS_LABEL
          )}
        </span>
        <Tooltip>
          <TooltipTrigger render={<Info className="size-3.5 shrink-0 cursor-help" />} />
          <TooltipContent>
            {isWorkspace ? getSpaceContactsTooltip(workspaceName ?? FALLBACK_SPACE_NAME) : LOCAL_CONTACTS_TOOLTIP}
          </TooltipContent>
        </Tooltip>
        <span className="ml-auto">{count}</span>
      </div>
    </div>
  )
}

export default ContactsHeader

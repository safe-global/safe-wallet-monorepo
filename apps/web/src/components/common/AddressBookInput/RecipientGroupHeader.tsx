import type { ReactElement } from 'react'
import { Building2, HardDrive, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import css from './styles.module.css'

const RecipientGroupHeader = ({
  source,
  workspaceName,
  count,
}: {
  source: ContactSource
  workspaceName?: string
  count: number
}): ReactElement => {
  const isSpace = source === ContactSource.space
  const Icon = isSpace ? Building2 : HardDrive

  return (
    <div className={css.groupHeader} data-testid="contact-group-header">
      <Icon size={14} className={css.groupIcon} />

      <Typography variant="paragraph-mini-bold" className={css.groupLabel}>
        {isSpace ? (
          <>
            Contacts of
            {workspaceName ? (
              /* Pill styling is a spoofing defense: user-provided names render in a
                 visual container that typed text cannot reproduce */
              <span className={css.nameBadge}>{workspaceName}</span>
            ) : (
              ' your Workspace'
            )}
          </>
        ) : (
          'Local contacts'
        )}
      </Typography>

      <Tooltip>
        <TooltipTrigger render={<Info size={14} className={css.groupInfoIcon} />} />
        <TooltipContent>
          {isSpace
            ? `Shared with everyone in ${workspaceName ?? 'your workspace'}. Only Workspace admins can add or change these contacts.`
            : 'Saved only in this browser, from your old address book. Not shared with your workspace.'}
        </TooltipContent>
      </Tooltip>

      <Typography variant="paragraph-mini" color="muted" className={css.groupCount}>
        {count}
      </Typography>
    </div>
  )
}

export default RecipientGroupHeader

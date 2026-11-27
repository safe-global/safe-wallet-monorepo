import { useRef, type ReactElement } from 'react'
import Link, { type LinkProps } from 'next/link'
import { LockKeyhole, StickyNote } from 'lucide-react'
import { ICON_STROKE } from '@safe-global/views/components/common/iconStroke'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { AppRoutes } from '@/config/routes'
import { formatNoteDate } from '../PrivateNote'
import { HIDDEN_NOTE, usePrivateNote } from '../../public/services/privateNotesPrototype'

type QueueNoteProps = {
  txId: string
  nonce?: number
  /** The transaction's page, where the note is shown in full */
  href?: LinkProps['href']
  /** Extra-wide tables: the note's text beside the icon, cut at two lines */
  showText?: boolean
}

/** A transaction's private note in the Workspace queue: an icon in the Note column, the note in its tooltip */
const QueueNote = ({ txId, nonce, href, showText = false }: QueueNoteProps): ReactElement | null => {
  const note = usePrivateNote(txId)
  const icon = useRef<SVGSVGElement>(null)
  if (!note) return null

  const subject = nonce === undefined ? 'this transaction' : `transaction ${nonce}`

  if (note === HIDDEN_NOTE) {
    return (
      <Tooltip>
        <TooltipTrigger
          data-testid="queue-note"
          aria-label={`Hidden note for ${subject}. Upgrade to Pro to read.`}
          className="flex w-fit shrink-0 items-center rounded-sm text-muted-foreground hover:text-foreground"
          render={<Link href={AppRoutes.spaces.plans} />}
        >
          <LockKeyhole className="size-4" strokeWidth={ICON_STROKE} aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent className="max-w-sm whitespace-normal">
          <p className="font-medium">Private note hidden</p>
          <p className="mt-1 leading-relaxed">Upgrade to Pro to read.</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        data-testid="queue-note"
        aria-label={showText ? `Note for ${subject}: ${note.text}` : `Note for ${subject}`}
        className={
          showText
            ? 'flex items-start gap-2 rounded-sm text-left'
            : 'flex w-fit shrink-0 items-center rounded-sm text-muted-foreground hover:text-foreground'
        }
        render={href ? <Link href={href} /> : undefined}
      >
        <StickyNote
          ref={icon}
          className={showText ? 'mt-0.5 size-4 shrink-0 text-muted-foreground' : 'size-4'}
          strokeWidth={ICON_STROKE}
          aria-hidden="true"
        />
        {showText && <span className="line-clamp-2 text-sm break-words">{note.text}</span>}
      </TooltipTrigger>
      {/* Points at the icon, not the middle of the note text */}
      <TooltipContent anchor={icon} className="max-w-sm whitespace-normal">
        <p className="font-medium">Private note · off-chain</p>
        <p className="mt-1 leading-relaxed whitespace-pre-wrap break-words">{note.text}</p>
        <p className="mt-1 text-background/70">
          {note.author} · {formatNoteDate(note.createdAt)}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export default QueueNote

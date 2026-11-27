import type { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import type { LinkProps } from 'next/link'
import { format } from 'date-fns'
import { Globe, LockKeyhole } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'

type PrivateNoteProps = {
  /**
   * - `private`: a Workspace member's note, readable by the Workspace only
   * - `hidden`: a note exists but the Workspace's plan no longer includes notes
   * - `public`: a note written before private notes, readable by anyone
   */
  variant: 'private' | 'hidden' | 'public'
  text?: string
  /** Who wrote it: a member's name, or the proposer's address for a public note */
  author?: ReactNode
  createdAt?: number
  /** Where "Upgrade to Pro" goes on a hidden note */
  upgradeHref?: LinkProps['href']
  className?: string
}

const LABELS = {
  private: { icon: LockKeyhole, title: 'Private note', scope: 'Off-chain' },
  hidden: { icon: LockKeyhole, title: 'Private note', scope: 'Off-chain' },
  public: { icon: Globe, title: 'Public note', scope: 'Visible to anyone' },
}

const HINTS = {
  private:
    'Written by a member of your Workspace. Only members can read it. It is not part of the transaction and Safe does not verify it.',
  hidden: 'Your Workspace keeps this note. Members can read it again on Safe Pro.',
  public: 'Written by the proposer before private notes. Anyone who looks up this transaction can read it.',
}

/** "11 Nov, 09:40", as in the Workspace queue */
export const formatNoteDate = (timestamp: number): string => format(timestamp, 'd MMM, HH:mm')

/**
 * The note on a transaction, where a signer reads it in the Safe: transaction details and the confirm screen. Set
 * apart from the transaction data and labelled, so it never reads as something Safe checked.
 */
const PrivateNote = ({ variant, text, author, createdAt, upgradeHref, className }: PrivateNoteProps): ReactElement => {
  const { icon: Icon, title, scope } = LABELS[variant]

  return (
    <div
      data-testid="tx-note-block"
      data-variant={variant}
      className={cn('flex min-w-0 flex-col gap-2 rounded-lg bg-[var(--color-background-main)] p-4', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <span data-testid="tx-note-label" className="text-sm font-semibold">
          {title}
        </span>
        <Tooltip>
          <TooltipTrigger render={<span tabIndex={0} className="rounded-sm text-xs text-muted-foreground" />}>
            {scope}
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{HINTS[variant]}</TooltipContent>
        </Tooltip>
      </div>

      {variant === 'hidden' ? (
        <p data-testid="tx-note-hidden" className="text-sm leading-relaxed text-muted-foreground">
          Note hidden.{' '}
          {upgradeHref ? (
            <Link href={upgradeHref} className="font-medium text-foreground underline underline-offset-2">
              Upgrade to Pro
            </Link>
          ) : (
            'Upgrade to Pro'
          )}{' '}
          to read.
        </p>
      ) : (
        <>
          {/* Plain text: a link in a note is never clickable */}
          <p data-testid="tx-note" className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {text}
          </p>
          {(author || createdAt !== undefined) && (
            <p className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <Icon aria-hidden className="size-3 shrink-0" />
              {author && (
                <>
                  By
                  <span data-testid="note-creator" className="flex min-w-0 items-center">
                    {author}
                  </span>
                </>
              )}
              {author && createdAt !== undefined && <span aria-hidden="true">·</span>}
              {createdAt !== undefined && formatNoteDate(createdAt)}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default PrivateNote

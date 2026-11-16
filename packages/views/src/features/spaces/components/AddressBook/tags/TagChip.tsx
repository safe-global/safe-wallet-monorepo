import { Tooltip, TooltipTrigger, TooltipContent } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { tagColor } from './tagColor'
import { isSystemTag } from './systemTags'

const CHIP = 'inline-flex max-w-40 items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-medium'

/**
 * An automatic label: no colour dot, a neutral fill and a hairline border, so it reads as set by
 * the app rather than by a teammate. The tooltip says why it is there.
 */
const SystemTagChip = ({ tag, title, className }: { tag: string; title?: string; className?: string }) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            data-testid="system-tag-chip"
            className={cn(CHIP, 'bg-muted text-foreground border-border cursor-default border', className)}
          />
        }
      >
        <span className="truncate">{tag}</span>
      </TooltipTrigger>
      <TooltipContent>{title ?? 'Added automatically'}</TooltipContent>
    </Tooltip>
  )
}

/**
 * A tag: colour dot on a soft fill, square corners, so a team-written label never reads as a
 * system marker. The automatic tags get their own look.
 */
export const TagChip = ({ tag, title, className }: { tag: string; title?: string; className?: string }) => {
  if (isSystemTag(tag)) return <SystemTagChip tag={tag} title={title} className={className} />

  const color = tagColor(tag)
  return (
    <span data-testid="tag-chip" className={cn(CHIP, color.fill, className)}>
      <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', color.dot)} />
      <span className="truncate">{tag}</span>
    </span>
  )
}

const DEFAULT_MAX_VISIBLE = 3

type TagChipsProps = {
  tags: string[]
  maxVisible?: number
}

/** Up to `maxVisible` chips, then "+N" with the rest in a tooltip. */
export const TagChips = ({ tags, maxVisible = DEFAULT_MAX_VISIBLE }: TagChipsProps) => {
  if (tags.length === 0) return null
  const visible = tags.slice(0, maxVisible)
  const rest = tags.slice(maxVisible)

  return (
    <span className="inline-flex flex-wrap items-center gap-1" data-testid="tag-chips">
      {visible.map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger className="text-muted-foreground cursor-default text-xs">+{rest.length}</TooltipTrigger>
          <TooltipContent>{rest.join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </span>
  )
}

export default TagChip

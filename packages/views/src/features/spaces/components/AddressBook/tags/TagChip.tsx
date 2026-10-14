import { Tooltip, TooltipTrigger, TooltipContent } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { tagColor } from './tagColor'

/**
 * A tag: colour dot on a soft fill, square corners. Deliberately unlike the pill-shaped Role
 * badge and the plain type line, so a team-written label never reads as a system marker.
 */
export const TagChip = ({ tag, className }: { tag: string; className?: string }) => {
  const color = tagColor(tag)
  return (
    <span
      data-testid="tag-chip"
      className={cn(
        'inline-flex max-w-40 items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-medium',
        color.fill,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', color.dot)} />
      <span className="truncate">{tag}</span>
    </span>
  )
}

const DEFAULT_MAX_VISIBLE = 3

/** Up to `maxVisible` chips, then "+N" with the rest in a tooltip. */
export const TagChips = ({ tags, maxVisible = DEFAULT_MAX_VISIBLE }: { tags: string[]; maxVisible?: number }) => {
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

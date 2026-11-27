import { cn } from '@safe-global/views/utils/cn'
import { TAG_COLOR_CLASSES, type TagLabel } from './tagColor'

const CHIP = 'inline-flex max-w-40 items-center gap-1.5 rounded-sm font-medium'

export type TagChipSize = 'sm' | 'lg'

const CHIP_SIZE_CLASSES: Record<TagChipSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  lg: 'px-2 py-1 text-sm',
}

/** A colour dot on a soft fill with square corners, so a team-written label never reads as a system marker. */
export const TagChip = ({
  name,
  color,
  size = 'sm',
  className,
}: TagLabel & { size?: TagChipSize; className?: string }) => {
  const classes = TAG_COLOR_CLASSES[color]
  return (
    <span data-testid="tag-chip" className={cn(CHIP, CHIP_SIZE_CLASSES[size], classes.chip, className)}>
      <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', classes.dot)} />
      <span className="truncate">{name}</span>
    </span>
  )
}

export const TagChips = ({ tags, size }: { tags: TagLabel[]; size?: TagChipSize }) => {
  if (tags.length === 0) return null
  return (
    <span className="inline-flex flex-wrap items-center gap-1" data-testid="tag-chips">
      {tags.map((tag) => (
        <TagChip key={tag.name} {...tag} size={size} />
      ))}
    </span>
  )
}

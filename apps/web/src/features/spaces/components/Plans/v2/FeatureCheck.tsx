import type { CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

const STAGGER_MS = 15

const PLAN_HOVER_CLASSES = [
  'transition-[background-color,color] duration-200 ease-out',
  'group-hover/plan:bg-foreground group-hover/plan:text-background group-hover/plan:duration-[260ms] group-hover/plan:ease-soft group-hover/plan:delay-(--check-delay)',
  'group-focus-within/plan:bg-foreground group-focus-within/plan:text-background group-focus-within/plan:duration-[260ms] group-focus-within/plan:ease-soft group-focus-within/plan:delay-(--check-delay)',
  'motion-reduce:transition-none motion-reduce:delay-0',
]

/** 20px check icon. With `followsPlanHover`, it inverts when its plan card is hovered, delayed by `index`. */
export const FeatureCheck = ({
  followsPlanHover,
  index = 0,
  isEmphasized,
}: {
  followsPlanHover?: boolean
  index?: number
  /** Dark version, for the mint current-plan column. */
  isEmphasized?: boolean
}) => (
  <span
    aria-hidden
    data-testid="plan-feature-check"
    style={followsPlanHover ? ({ '--check-delay': `${index * STAGGER_MS}ms` } as CSSProperties) : undefined}
    className={cn(
      'flex size-5 shrink-0 items-center justify-center rounded-full',
      isEmphasized ? 'bg-foreground text-background' : 'bg-muted',
      followsPlanHover && PLAN_HOVER_CLASSES,
    )}
  >
    <Check className="size-3" strokeWidth={2} />
  </span>
)

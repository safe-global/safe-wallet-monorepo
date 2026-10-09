import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

/** The stagger comes from the list: see FEATURE_LIST_STAGGER in PlanCardDetails. */
const PLAN_HOVER_CLASSES = [
  'transition-[background-color,color] duration-200 ease-out',
  'group-hover/plan:bg-foreground group-hover/plan:text-background group-hover/plan:duration-[260ms] group-hover/plan:ease-soft group-hover/plan:delay-(--check-delay)',
  'group-focus-within/plan:bg-foreground group-focus-within/plan:text-background group-focus-within/plan:duration-[260ms] group-focus-within/plan:ease-soft group-focus-within/plan:delay-(--check-delay)',
  'motion-reduce:transition-none motion-reduce:delay-0',
]

/** 20px check. With `followsPlanHover`, it inverts while its plan card is hovered. */
export const FeatureCheck = ({
  followsPlanHover,
  isEmphasized,
}: {
  followsPlanHover?: boolean
  /** Dark version, for the current plan's column. */
  isEmphasized?: boolean
}) => (
  <span
    aria-hidden
    className={cn(
      'flex size-5 shrink-0 items-center justify-center rounded-full',
      isEmphasized ? 'bg-foreground text-background' : 'bg-muted',
      followsPlanHover && PLAN_HOVER_CLASSES,
    )}
  >
    <Check className="size-3" strokeWidth={2} />
  </span>
)

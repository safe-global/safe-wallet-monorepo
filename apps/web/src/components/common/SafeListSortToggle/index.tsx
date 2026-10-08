import { useAppDispatch, useAppSelector } from '@/store'
import { type OrderByOption, selectOrderByPreference, setOrderByPreference } from '@/store/orderByPreferenceSlice'
import {
  SafeListSortToggleView,
  type SafeListSortToggleViewProps,
} from '@views/components/common/SafeListSortToggle/SafeListSortToggleView'

/**
 * Sort control for the Safe lists (account selector dropdown + All accounts modal).
 * Reads/writes the shared, persisted orderByPreference so every Safe list stays in sync.
 *
 * @param className - Overrides the trigger's border/shadow/hover. Defaults suit card and dialog
 *   surfaces; on the muted page background pass `border-border shadow-xs` plus
 *   `hover:bg-foreground/[0.06]`, where the `bg-muted` hover would be invisible.
 * @param size - Match the other controls on the row (e.g. `lg` beside a `size="lg"` CTA and an
 *   `inputSize="lg"` search field).
 */
const SafeListSortToggle = ({
  className,
  size,
}: {
  className?: string
  size?: SafeListSortToggleViewProps['size']
}) => {
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  return (
    <SafeListSortToggleView
      orderBy={orderBy}
      onOrderByChange={(value) => dispatch(setOrderByPreference({ orderBy: value as OrderByOption }))}
      triggerClassName={className}
      size={size}
    />
  )
}

export default SafeListSortToggle

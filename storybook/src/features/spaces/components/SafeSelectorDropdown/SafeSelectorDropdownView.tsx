import type { ComponentProps, MouseEvent, ReactNode, RefObject } from 'react'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import InlineRetryError from '@views/components/common/InlineRetryError'
import type { getSafeSelectorClassVariants } from '@views/features/spaces/components/SafeSelectorDropdown/utils/classVariants'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

function SafeSelectorDropdownSkeleton() {
  return (
    <div className="w-full min-[430px]:w-auto min-[430px]:flex-1 min-[430px]:min-w-0 min-[430px]:max-w-[515px] h-10 flex items-center gap-4 rounded-lg py-0.5 pl-1.5 pr-2 bg-muted">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-24 rounded-full" />
        <Skeleton className="h-3 w-32 rounded-full" />
      </div>
      <div className="flex flex-col items-end gap-1.5 pr-12">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}

type SelectProps = ComponentProps<typeof Select>

export interface SafeSelectorDropdownViewProps {
  /** Rendered instead of the selector while the trigger has nothing to show. */
  placeholder?: 'error' | 'skeleton'
  onRetry?: () => void
  isDisabled: boolean
  variants: ReturnType<typeof getSafeSelectorClassVariants>
  value?: string
  onValueChange: ComponentProps<typeof Select<string>>['onValueChange']
  open: boolean
  onOpenChange?: SelectProps['onOpenChange']
  triggerRef: RefObject<HTMLButtonElement | null>
  triggerAddress: string
  onPointerDownCapture: () => void
  onDisplayClick: (event: MouseEvent<HTMLDivElement>) => void
  triggerContent: ReactNode
  dropdown: ReactNode
}

export function SafeSelectorDropdownView({
  placeholder,
  onRetry,
  isDisabled,
  variants,
  value,
  onValueChange,
  open,
  onOpenChange,
  triggerRef,
  triggerAddress,
  onPointerDownCapture,
  onDisplayClick,
  triggerContent,
  dropdown,
}: SafeSelectorDropdownViewProps) {
  if (placeholder === 'error') return <InlineRetryError message="Failed to load Safe data" onRetry={onRetry} />
  if (placeholder === 'skeleton') return <SafeSelectorDropdownSkeleton />

  const selectElement = (
    <Select
      value={value}
      onValueChange={onValueChange}
      open={open}
      onOpenChange={onOpenChange}
      // base-ui highlights by moving DOM focus with the pointer, pulling it off the search input on
      // hover and on leaving the popup. Rows use :hover styles instead.
      highlightItemOnHover={false}
      // Deliberately not disabled: a disabled <button> blocks the inline address actions (copy,
      // explorer, env hint). Safe switching is prevented by the forced-closed `open` above instead.
    >
      <div
        className={cn(
          // The wrapper's overflow-hidden clips this focus-visible ring into stray top/bottom bars,
          // so suppress it — the card shows no focus ring by design (wrapper sets focus:ring-0).
          //
          // min-w-0 (trigger + value slot): without it a long safe name can't shrink/truncate and
          // pushes the balance and chevron out of the clipped card. Concretely: `flex-1` alone still
          // floors a flex item at min-content, so display content plus the paddings exceeded the
          // selector's fixed box and overflowed ~19px right; the trigger lays its chevron out with
          // `justify-end`, so the chevron rode that overflow into the gap and its padding ended up
          // under the nested-safes button. Letting both shrink keeps them inside.
          '-m-4 flex-1 min-w-0 w-full border-0 shadow-none bg-transparent dark:bg-transparent py-0 pl-4 hover:bg-transparent dark:hover:bg-transparent data-[state=open]:bg-transparent focus-visible:ring-0 focus-visible:border-0 [&_[data-slot=select-value]]:pr-0 [&_[data-slot=select-value]]:min-w-0 relative',
          variants.triggerClass,
          isDisabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {/* The trigger is an invisible full-bleed overlay BEHIND the display content, so the inline
            copy/explorer actions render outside the trigger <button> (no interactive nesting). */}
        <SelectTrigger
          ref={triggerRef}
          className={cn(
            // justify-end: the SelectValue is sr-only (out of flow), so the icon is the only flex
            // item and justify-between would park it at the left, behind the avatar.
            // eslint-disable-next-line no-restricted-syntax -- invisible full-bleed overlay trigger behind the card content (inset-0, ring/skin suppression); not a size/skin variant
            'absolute inset-0 z-0 h-auto w-auto justify-end border-0 bg-transparent p-0 hover:bg-transparent focus-visible:border-0 focus-visible:ring-0',
            isDisabled && 'cursor-not-allowed opacity-50',
          )}
          variant="ghost"
          iconWrapperClassName={variants.iconWrapperClass}
          aria-label={`Select Safe ${triggerAddress}`}
          aria-disabled={isDisabled || undefined}
          data-testid="open-safes-icon"
        >
          <SelectValue className="sr-only">{triggerAddress}</SelectValue>
        </SelectTrigger>
        <div
          onPointerDownCapture={onPointerDownCapture}
          onClick={onDisplayClick}
          className="relative z-10 flex h-full w-full pointer-events-none [&_[data-slot=tooltip-trigger]]:pointer-events-auto [&_[role=button]]:pointer-events-auto [&_a]:pointer-events-auto [&_button]:pointer-events-auto"
        >
          {triggerContent}
        </div>
      </div>

      {dropdown}
    </Select>
  )

  // TODO: change rounded-lg (8px) to rounded-2xl (16px) after migrating to the new design system
  // A muted 40px chip: the SpaceSafeBar pill that groups this with the nested-safes and
  // network controls carries the white card and its shadow.
  const wrapperClassName = cn(
    'group relative w-full min-[430px]:w-auto min-[430px]:flex-1 min-[430px]:min-w-0 min-[430px]:max-w-[515px] h-10 flex items-center rounded-lg py-0.5 pl-1.5 pr-2 overflow-hidden bg-muted focus:ring-0',
    variants.wrapperClass,
  )

  const innerContent = (
    <>
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-muted-foreground/5 opacity-0 group-hover:opacity-100" />
      {selectElement}
    </>
  )

  if (isDisabled) {
    return (
      <Tooltip>
        <TooltipTrigger render={<div data-testid="space-safes-navigation-block" className={wrapperClassName} />}>
          {innerContent}
        </TooltipTrigger>
        <TooltipContent side="bottom">Changing the Safe is not allowed in this screen</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div data-testid="space-safes-navigation-block" className={wrapperClassName}>
      {innerContent}
    </div>
  )
}

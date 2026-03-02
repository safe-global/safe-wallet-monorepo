import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'

/**
 * Collapsible Component
 *
 * An interactive component which expands/collapses a panel.
 *
 * @see https://ui.shadcn.com/docs/components/base/collapsible
 *
 * @example
 * ```tsx
 * <Collapsible defaultOpen>
 *   <CollapsibleTrigger>Toggle details</CollapsibleTrigger>
 *   <CollapsibleContent>
 *     Hidden content that expands/collapses.
 *   </CollapsibleContent>
 * </Collapsible>
 * ```
 *
 * @remarks
 * Key Props:
 * - Root: `defaultOpen`, `open`, `onOpenChange`
 * - Trigger / Content: `asChild`, `className`
 */

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

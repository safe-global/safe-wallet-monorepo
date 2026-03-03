'use client'

import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'

import { cn } from '@/utils/cn'
import { CircleIcon } from 'lucide-react'

/**
 * Radio Group Component
 *
 * A set of checkable options where only one can be selected (single choice).
 *
 * @see https://ui.shadcn.com/docs/components/base/radio-group
 *
 * @example
 * ```tsx
 * <RadioGroup defaultValue="option-one">
 *   <Field orientation="horizontal">
 *     <RadioGroupItem value="option-one" id="option-one" />
 *     <FieldLabel htmlFor="option-one">Option One</FieldLabel>
 *   </Field>
 *   <Field orientation="horizontal">
 *     <RadioGroupItem value="option-two" id="option-two" />
 *     <FieldLabel htmlFor="option-two">Option Two</FieldLabel>
 *   </Field>
 * </RadioGroup>
 * ```
 *
 * @remarks
 * Key Props:
 * - RadioGroup: `defaultValue`, `value`, `onValueChange`
 * - RadioGroupItem: `value` (unique identifier), `disabled`
 */

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn('grid gap-3 w-full', className)} {...props} />
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        'border-input text-primary dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 flex size-4 rounded-full shadow-xs focus-visible:ring-[3px] aria-invalid:ring-[3px] group/radio-group-item peer relative aspect-square shrink-0 border outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="group-aria-invalid/radio-group-item:text-destructive text-primary flex size-4 items-center justify-center"
      >
        <CircleIcon className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 fill-current" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }

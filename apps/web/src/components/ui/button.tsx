import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

/**
 * Button Component
 *
 * Displays a button or a component that looks like a button.
 *
 * @see https://ui.shadcn.com/docs/components/base/button
 *
 * @example
 * ```tsx
 * <Button variant="outline">Button</Button>
 * ```
 *
 * @remarks
 * Key Props:
 * - `variant` ('default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'destructive-outline' | 'surface' | 'link')
 * - `size` ('default' | 'xs' | 'sm' | 'lg' | 'action' | 'submit' | 'xl' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg')
 * - `render`
 * - `className`
 */

const buttonVariants = cva(
  "focus-visible:border-ring cursor-pointer focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-md border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        // NB dark disabled: opacity-50 alone still reads as an actionable green (#12ff80) pill,
        // so the filled primary swaps to the muted surface — mirroring how light mode grays out.
        default:
          'bg-primary text-primary-foreground hover:bg-primary/80 dark:[&_svg]:text-black dark:disabled:bg-muted dark:disabled:text-muted-foreground dark:aria-disabled:bg-muted dark:aria-disabled:text-muted-foreground dark:disabled:[&_svg]:text-muted-foreground dark:aria-disabled:[&_svg]:text-muted-foreground',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-border dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground shadow-xs',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
        destructive:
          'bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30',
        // Bordered destructive: for labelled destructive actions that read as a bordered button
        // (e.g. "Leave workspace"). Replaces hand-rolled `outline` + `className="text-destructive"`.
        'destructive-outline':
          'border-border bg-background text-destructive hover:bg-destructive/10 hover:text-destructive dark:bg-input/30 dark:border-border shadow-xs',
        // Card-surface CTA: reads as a raised card on a coloured/promo surface (Earn/Stake/
        // Add-funds style). Same border+shadow as outline, filled with the `card` token
        // instead of the page background. Replaces per-call `bg-card`/`bg-[--color-background-paper]`.
        surface: 'border-border bg-card text-card-foreground hover:bg-muted hover:text-foreground shadow-xs',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-9 gap-1.5 px-4 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 px-2 text-xs in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1 px-4 in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5',
        lg: 'h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        // Prominent call-to-action pill: use for the main action(s) of a surface
        // (Send/Receive/Swap, Confirm/Execute, Save settings, Filter/Export). Pair
        // with variant="default" for the primary action and variant="secondary" for
        // secondary actions so they share one height, padding, and icon size.
        action: "h-10 gap-2 px-6 [&_svg:not([class*='size-'])]:size-5",
        // Modal / flow / settings submit button: the action pill plus a stable minimum width so
        // the label can swap (e.g. "Execute" → spinner) without the button resizing. Replaces the
        // per-call magic min-w-[82/112/114/122px]. Pair with a `w-full lg:w-auto` wrapper for the
        // full-width-on-mobile flow submit pattern.
        submit: "h-10 gap-2 px-6 min-w-[7rem] [&_svg:not([class*='size-'])]:size-5",
        // Full-screen onboarding / flow footer CTA: the taller 48px scale used by the Spaces
        // onboarding Back/Continue buttons. Use via the OnboardingFooter preset; pair with a
        // `w-full xl:flex-1` wrapper for the stacked-mobile → row-on-xl layout.
        xl: 'h-12 gap-2 px-6',
        icon: 'size-9',
        'icon-xs': "size-6 in-data-[slot=button-group]:rounded-sm [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8 in-data-[slot=button-group]:rounded-sm',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>
type AnchorRenderElement = React.ReactElement<React.ComponentPropsWithoutRef<'a'>, 'a'>
type AnchorButtonProps = React.ComponentPropsWithoutRef<'a'> & {
  'data-slot': string
}

const isAnchorRender = (render: ButtonProps['render']): render is AnchorRenderElement => {
  return React.isValidElement(render) && render.type === 'a'
}

function Button({ className, variant = 'default', size = 'default', render, nativeButton, ...props }: ButtonProps) {
  const buttonClassName = cn(buttonVariants({ variant, size, className }))

  if (isAnchorRender(render)) {
    const anchorProps = props as React.ComponentPropsWithoutRef<'a'>
    const clonedAnchorProps: AnchorButtonProps = {
      ...anchorProps,
      'data-slot': 'button',
      className: cn(buttonClassName, render.props.className),
    }

    return React.cloneElement(render, clonedAnchorProps)
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonClassName}
      render={render}
      nativeButton={nativeButton}
      {...props}
    />
  )
}

export { Button, buttonVariants }

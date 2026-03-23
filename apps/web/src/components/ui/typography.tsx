import type React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

/**
 * Typography component aligned with Figma Obra-shadcn-ui--safe-.
 *
 * In Figma, typography is defined by styles (heading 1, paragraph/regular, etc.), not by components.
 * We use a component with variants in code because it centralizes styles and makes usage easier.
 *
 * Figma style → variant mapping: see .claude/skills/design.figma-to-code/reference.md
 *
 * @see https://www.figma.com/design/trBVcpjZslO63zxiNUI9io/Obra-shadcn-ui--safe-?node-id=310-257309
 */

const typographyVariants = cva('m-0', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-[48px] font-semibold leading-[48px] tracking-[-0.015em] text-balance',
      h2: 'scroll-m-20 text-[30px] font-semibold leading-[30px] tracking-[-0.01em]',
      h3: 'scroll-m-20 text-2xl font-semibold leading-[28.8px] tracking-[-0.01em]',
      h4: 'scroll-m-20 text-xl font-semibold leading-6 tracking-normal',
      paragraph: 'text-base leading-6 font-normal',
      'paragraph-medium': 'text-base leading-6 font-medium',
      'paragraph-bold': 'text-base leading-6 font-semibold',
      'paragraph-small': 'text-sm leading-5 font-normal',
      'paragraph-small-medium': 'text-sm leading-5 font-medium',
      'paragraph-small-bold': 'text-sm leading-5 font-semibold',
      'paragraph-mini': 'text-xs leading-4 font-normal',
      'paragraph-mini-medium': 'text-xs leading-4 font-medium',
      'paragraph-mini-bold': 'text-xs leading-4 font-semibold',
      code: 'font-mono text-base leading-6 font-normal',
    },
    align: {
      left: '',
      center: 'block w-full text-center',
      right: 'block w-full text-right',
    },
    color: {
      default: '',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'paragraph',
    align: 'left',
    color: 'default',
  },
})

const variantElementMap = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  paragraph: 'p',
  'paragraph-medium': 'p',
  'paragraph-bold': 'p',
  'paragraph-small': 'span',
  'paragraph-small-medium': 'span',
  'paragraph-small-bold': 'span',
  'paragraph-mini': 'span',
  'paragraph-mini-medium': 'span',
  'paragraph-mini-bold': 'span',
  code: 'code',
} as const

interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof typographyVariants> {}

function Typography({
  variant = 'paragraph',
  align = 'left',
  color = 'default',
  className,
  ...props
}: TypographyProps) {
  const Tag = variantElementMap[variant ?? 'paragraph'] as React.ElementType
  return (
    <Tag
      data-slot="typography"
      data-variant={variant}
      className={cn(typographyVariants({ variant, align, color }), className)}
      {...props}
    />
  )
}

export { Typography, typographyVariants }

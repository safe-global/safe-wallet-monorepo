'use client'

import { useTheme } from 'next-themes'
import { type ToasterProps } from 'sonner'
import { SonnerView } from '@views/components/ui/SonnerView'

/**
 * Sonner Component
 *
 * Toast notifications (Toaster). Use with toast() from sonner. Built on Sonner.
 *
 * @see https://ui.shadcn.com/docs/components/base/sonner
 *
 * @example
 * ```tsx
 * <Toaster /> then toast('Message') or toast.success('Done')
 * ```
 *
 * @remarks
 * Key Props:
 * - `position`, `expand`, `theme`, `icons`, `toastOptions` — see Sonner / Base UI sonner docs
 */

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return <SonnerView theme={theme as ToasterProps['theme']} {...props} />
}

export { Toaster }

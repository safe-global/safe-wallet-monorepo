import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export type OidcSignInButtonViewProps = {
  label: string
  icon: ReactNode
  testId: string
  variant?: 'primary' | 'secondary'
  onClick: () => void
}

export const OidcSignInButtonView = ({
  label,
  icon,
  testId,
  variant = 'secondary',
  onClick,
}: OidcSignInButtonViewProps) => {
  // Avoid `bg-primary` here: it flips to Safe-green in dark mode and would
  // clash with the Google "G" logo's own green path. `--sidebar-primary` is
  // the project's neutral primary pair that flips dark ↔ light without the
  // brand-green override.
  const primaryOverride =
    variant === 'primary' ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90' : ''

  return (
    <Button
      variant={variant === 'primary' ? 'default' : 'secondary'}
      onClick={onClick}
      data-testid={testId}
      className={`h-12 w-full gap-3 rounded-md px-4 text-[15px] font-semibold ${primaryOverride}`}
    >
      {icon}
      {label}
    </Button>
  )
}

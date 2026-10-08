import type { ReactElement } from 'react'
import { ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { Typography } from '@/components/ui/typography'

export type HypernativeLoginLineViewProps = {
  onLogin: () => void
}

export const HypernativeLoginLineView = ({ onLogin }: HypernativeLoginLineViewProps): ReactElement => {
  return (
    <Typography
      variant="paragraph-mini"
      align="center"
      className="flex items-center justify-center gap-1 py-2 text-[var(--color-primary-light)]"
      data-testid="hypernative-login-line"
    >
      Already using Hypernative?{' '}
      <button type="button" onClick={onLogin} className="cursor-pointer font-semibold underline">
        Log in
      </button>
      <ExternalLinkIcon className="size-3.5" aria-hidden />
    </Typography>
  )
}

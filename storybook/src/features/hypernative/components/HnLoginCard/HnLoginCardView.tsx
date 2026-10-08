import type { MouseEvent, ReactElement } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import AlertIcon from '@/public/images/common/alert.svg'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'

export type HnLoginCardViewProps = {
  showLoginCard: boolean
  onLogin: (e: MouseEvent<HTMLAnchorElement>) => void
}

export const HnLoginCardView = ({ showLoginCard, onLogin }: HnLoginCardViewProps): ReactElement => {
  if (showLoginCard) {
    return (
      <Alert variant="warning" outlined={false} className="flex w-auto min-w-[303px] items-center gap-3 px-4 py-0">
        <AlertIcon className="size-4 translate-y-0! text-[var(--color-warning-main)]" />
        <AlertDescription>Hypernative not connected.</AlertDescription>
        <ExternalLink className="hover:text-muted-foreground" href="#" onClick={onLogin}>
          Log in
        </ExternalLink>
      </Alert>
    )
  }

  return (
    <div className="flex flex-row items-center gap-1 py-2 pr-4">
      <HypernativeIcon className="size-4 text-[var(--color-primary-main)]" />
      <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
        Logged in to Hypernative
      </Typography>
    </div>
  )
}

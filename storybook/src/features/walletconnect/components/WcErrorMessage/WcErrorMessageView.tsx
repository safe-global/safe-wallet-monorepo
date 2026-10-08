import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'

export type WcErrorMessageViewProps = {
  summary?: string
  details?: string
  renderLogoHeader: (errorMessage: string) => ReactNode
  onClose: () => void
}

export const WcErrorMessageView = ({ summary, details, renderLogoHeader, onClose }: WcErrorMessageViewProps) => {
  return (
    <div className={css.errorContainer}>
      {renderLogoHeader(summary ?? 'An error occurred')}

      {details && <Typography className={`mt-1 ${css.details}`}>{details}</Typography>}

      <Button
        variant="default"
        onClick={onClose}
        // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke values have no variant
        className="py-[var(--space-1)] px-[var(--space-4)] mt-[var(--space-3)]"
      >
        OK
      </Button>
    </div>
  )
}

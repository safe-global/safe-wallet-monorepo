import { X as CloseIcon } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Typography } from '@safe-global/views/components/ui/typography'
import StatusPendingIcon from '@safe-global/views/assets/images/hypernative/status-pending.svg'
import type { WithHnSignupFlowProps } from '@safe-global/views/features/hypernative/components/withHnSignupFlow/types'
import css from './styles.module.css'
import type { ReactElement } from 'react'

export interface HnPendingBannerProps extends WithHnSignupFlowProps {
  onDismiss?: () => void
}

/**
 * Pure HnPendingBanner component without side effects.
 * Receives onDismiss callback from parent wrapper.
 */
export const HnPendingBanner = ({ onDismiss }: HnPendingBannerProps): ReactElement => {
  return (
    <div className={css.banner}>
      <div className={`flex flex-row items-start gap-2 ${css.content}`}>
        <div className={css.iconContainer}>
          <StatusPendingIcon className={css.icon} />
        </div>
        <div className={css.textContainer}>
          <Typography variant="paragraph-bold" className={css.title}>
            Guardian setup in progress
          </Typography>
          <Typography variant="paragraph-small" className={css.description}>
            We&apos;ve received your request and will follow up with next steps.
          </Typography>
        </div>
      </div>
      {onDismiss && (
        <Button variant="ghost" className={css.closeButton} aria-label="close" onClick={onDismiss}>
          <CloseIcon />
        </Button>
      )}
    </div>
  )
}

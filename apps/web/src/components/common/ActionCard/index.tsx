import type { ReactElement } from 'react'
import { trackEvent } from '@/services/analytics'
import { ActionCardView, type ActionCardProps } from '@views/components/common/ActionCard/ActionCardView'

export type {
  ActionCardSeverity,
  ActionCardButton,
  LearnMoreLink,
  ActionCardProps,
} from '@views/components/common/ActionCard/ActionCardView'

export const ActionCard = ({ action, trackingEvent, ...props }: ActionCardProps): ReactElement => {
  const onActionClick = action?.href
    ? trackingEvent
      ? () => trackEvent(trackingEvent)
      : undefined
    : () => {
        if (trackingEvent) {
          trackEvent(trackingEvent)
        }
        action?.onClick?.()
      }

  return <ActionCardView {...props} action={action} onActionClick={onActionClick} />
}

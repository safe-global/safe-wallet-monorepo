import type { ReactElement, ReactNode } from 'react'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import type { InviterSlotProps } from '@views/features/spaces/components/InviteBanner/InviterView'

export type PreviewInviteViewProps = {
  isDarkMode: boolean
  spaceName: string
  renderInviter: (props: InviterSlotProps) => ReactNode
  acceptButton: ReactElement
  declineButton: ReactElement
}

export const PreviewInviteView = ({
  isDarkMode,
  spaceName,
  renderInviter,
  acceptButton,
  declineButton,
}: PreviewInviteViewProps) => {
  return (
    <div
      className={cn(
        'mb-8 rounded-xl p-4',
        isDarkMode ? 'bg-[var(--color-info-background)]' : 'bg-[var(--color-info-light)]',
      )}
    >
      <div className="flex flex-row gap-4 max-[600px]:flex-col max-[600px]:gap-2">
        <InitialsAvatar name={spaceName} size="medium" />
        <div className="flex flex-grow flex-row flex-wrap items-center gap-x-1 gap-y-1">
          <Typography variant="paragraph">You were invited to join</Typography>
          <Typography variant="paragraph-bold">{spaceName}</Typography>
          {renderInviter({ variant: 'paragraph', avatarSize: 20 })}
        </div>
        <div className="flex flex-row gap-2">
          <Track {...SPACE_EVENTS.ACCEPT_INVITE} label={SPACE_LABELS.preview_banner}>
            {acceptButton}
          </Track>
          <Track {...SPACE_EVENTS.DECLINE_INVITE} label={SPACE_LABELS.preview_banner}>
            {declineButton}
          </Track>
        </div>
      </div>
    </div>
  )
}

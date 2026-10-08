import type { ReactElement } from 'react'
import { XIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import css from './styles.module.css'
import Track from '@/components/common/Track'
import { OUTREACH_EVENTS } from '@/services/analytics/events/outreach'

export type OutreachPopupViewProps = {
  outreachUrl: string
  onOpenSurvey: () => void
  onAskAgainLater: () => void
  onClose: () => void
}

export const OutreachPopupView = ({
  outreachUrl,
  onOpenSurvey,
  onAskAgainLater,
  onClose,
}: OutreachPopupViewProps): ReactElement => {
  return (
    <div className={css.popup}>
      <div className={css.container}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <Avatar size="sm">
              <AvatarImage src="/images/common/outreach-popup-avatar.png" alt="Product marketing lead avatar" />
              <AvatarFallback>DP</AvatarFallback>
            </Avatar>
            <div className="ml-2">
              <Typography variant="paragraph-small">Danilo Pereira</Typography>
              <Typography variant="paragraph-small" color="muted">
                Product Marketing Lead
              </Typography>
            </div>
          </div>
          <Typography variant="h4">
            Your voice matters!
            <br />
            Help us improve {'Safe{Wallet}'}.
          </Typography>
          <Typography>
            In 1 minute, tell us why you use {'Safe{Wallet}'}. Your input will help us create a better, smarter wallet
            experience for you!
          </Typography>
          <Track {...OUTREACH_EVENTS.OPEN_SURVEY}>
            <Button
              className="w-full"
              variant="default"
              onClick={onOpenSurvey}
              render={<Link rel="noreferrer noopener" target="_blank" href={outreachUrl} />}
            >
              Get Involved
            </Button>
          </Track>
          <Track {...OUTREACH_EVENTS.ASK_AGAIN_LATER}>
            <Button className="w-full" variant="ghost" onClick={onAskAgainLater}>
              Ask me later
            </Button>
          </Track>
          <Typography variant="paragraph-small" color="muted" align="center">
            It&apos;ll only take 1 minute.
          </Typography>
        </div>
        <Track {...OUTREACH_EVENTS.CLOSE_POPUP}>
          <Button
            className={css.close}
            variant="ghost"
            size="icon-sm"
            aria-label="close outreach popup"
            onClick={onClose}
          >
            <XIcon className="size-4" />
          </Button>
        </Track>
      </div>
    </div>
  )
}

import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'

export type RenewInviteButtonViewProps = {
  onRenew: () => void
  isLoading: boolean
  hasEmail: boolean
  mixpanelParams: Record<string, string>
}

export const RenewInviteButtonView = ({ onRenew, isLoading, hasEmail, mixpanelParams }: RenewInviteButtonViewProps) => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span>
            <Track
              {...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_RENEWED}
              label={SPACE_LABELS.invite_list}
              mixpanelParams={mixpanelParams}
            >
              <Button variant="ghost" size="icon-sm" onClick={onRenew} disabled={isLoading}>
                <Send className="size-4 translate-x-[-0.8px] translate-y-[0.5px] fill-none text-[var(--color-border-main)]" />
              </Button>
            </Track>
          </span>
        }
      />
      <TooltipContent>{hasEmail ? 'Renew invitation and resend the email' : 'Renew invitation'}</TooltipContent>
    </Tooltip>
  )
}

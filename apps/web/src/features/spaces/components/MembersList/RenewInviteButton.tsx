import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import useRenewInvite from './useRenewInvite'

const RenewInviteButton = ({ member }: { member: MemberDto }) => {
  const { renewInvite: handleRenew, isLoading } = useRenewInvite(member)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span>
            <Track {...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_RENEWED} label={SPACE_LABELS.invite_list}>
              <Button variant="ghost" size="icon-sm" onClick={handleRenew} disabled={isLoading}>
                <Send className="size-4 translate-x-[-0.8px] translate-y-[0.5px] fill-none text-border" />
              </Button>
            </Track>
          </span>
        }
      />
      <TooltipContent>
        {member.user.email ? 'Renew invitation and resend the email' : 'Renew invitation'}
      </TooltipContent>
    </Tooltip>
  )
}

export default RenewInviteButton

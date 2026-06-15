import { Box, IconButton, SvgIcon, Tooltip } from '@mui/material'
import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Send } from 'lucide-react'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'
import useRenewInvite from './useRenewInvite'

const RenewInviteButton = ({ member }: { member: MemberDto }) => {
  const { renewInvite: handleRenew, isLoading } = useRenewInvite(member)

  return (
    <Tooltip title={member.user.email ? 'Renew invitation and resend the email' : 'Renew invitation'} placement="top">
      <Box component="span">
        <Track {...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_RENEWED} label={SPACE_LABELS.invite_list}>
          <IconButton onClick={handleRenew} disabled={isLoading} size="small">
            <SvgIcon
              component={Send}
              inheritViewBox
              color="border"
              fontSize="small"
              sx={{ fill: 'none', transform: 'translate(-0.8px, 0.5px)' }}
            />
          </IconButton>
        </Track>
      </Box>
    </Tooltip>
  )
}

export default RenewInviteButton

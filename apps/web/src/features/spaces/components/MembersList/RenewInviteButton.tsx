import { Box, IconButton, SvgIcon, Tooltip } from '@mui/material'
import { type MemberDto, useMembersRenewInviteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Send } from 'lucide-react'
import { useCurrentSpaceId } from '@/features/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import Track from '@/components/common/Track'

const RenewInviteButton = ({ member }: { member: MemberDto }) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [renewInvite, { isLoading }] = useMembersRenewInviteV1Mutation()

  const handleRenew = async () => {
    if (!spaceId) return

    const { error } = await renewInvite({ spaceId, userId: member.user.id })

    if (error) {
      dispatch(
        showNotification({
          message: getRtkQueryErrorMessage(error) || 'Failed to renew the invitation. Please try again.',
          variant: 'error',
          groupKey: 'renew-invite-error',
        }),
      )
      return
    }

    dispatch(
      showNotification({
        message: `Invitation renewed for ${member.name}`,
        variant: 'success',
        groupKey: 'renew-invite-success',
      }),
    )
  }

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

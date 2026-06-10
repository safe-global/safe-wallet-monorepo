import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { isAddress } from 'ethers'
import { useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

interface MemberInvite {
  address: string
  role: MemberRole
}

export interface InviteMembersFormValues {
  members: MemberInvite[]
}

const useInviteForm = (spaceId: string | undefined, onSuccess: () => void) => {
  const [inviteMembers] = useMembersInviteUserV1Mutation()

  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const methods = useForm<InviteMembersFormValues>({
    mode: 'onChange',
    defaultValues: {
      members: [{ address: '', role: MemberRole.MEMBER }],
    },
  })

  const { handleSubmit, control, formState, register, setValue, trigger } = methods
  const { fields, append, remove } = useFieldArray({ control, name: 'members' })

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    const validMembers = data.members.filter((m) => m.address.trim() !== '')

    const hasUnresolvedNames = validMembers.some((m) => !isAddress(m.address))
    if (hasUnresolvedNames) {
      setError('Please wait for all ENS names to resolve')
      return
    }

    if (validMembers.length === 0) {
      setIsSubmitting(true)
      onSuccess()
      return
    }

    setError(undefined)
    setIsSubmitting(true)

    try {
      const usersToInvite = validMembers.map((member) => ({
        type: 'wallet' as const,
        address: member.address,
        name: member.address,
        role: member.role,
      }))

      const result = await inviteMembers({
        spaceId,
        inviteUsersDto: { users: usersToInvite },
      })

      if (result.error) {
        setError(getRtkQueryErrorMessage(result.error) || 'Failed to invite members. Please try again.')
        setIsSubmitting(false)
        return
      }

      result.data?.forEach((invitation) => {
        trackEvent(
          { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: spaceId },
          {
            workspace_id: spaceId,
            user_id: invitation.userId,
            role: invitation.role.toLowerCase(),
            batch_size: validMembers.length,
          },
        )
      })

      onSuccess()
    } catch {
      setError('Something went wrong inviting members. Please try again.')
      setIsSubmitting(false)
    }
  })

  return {
    control,
    formState,
    register,
    setValue,
    trigger,
    fields,
    append,
    remove,
    onSubmit,
    error,
    isSubmitting,
  }
}

export default useInviteForm

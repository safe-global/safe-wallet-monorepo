import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'

interface MemberInvite {
  address: string
  role: MemberRole
}

export interface InviteMembersFormValues {
  members: MemberInvite[]
}

const useInviteForm = (spaceId: string | undefined, onSuccess: () => void) => {
  const dispatch = useAppDispatch()
  const [inviteMembers] = useMembersInviteUserV1Mutation()

  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const methods = useForm<InviteMembersFormValues>({
    mode: 'onChange',
    defaultValues: {
      members: [{ address: '', role: MemberRole.MEMBER }],
    },
  })

  const { handleSubmit, control, formState, register } = methods
  const { fields, append, remove } = useFieldArray({ control, name: 'members' })

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    const validMembers = data.members.filter((m) => m.address.trim() !== '')
    if (validMembers.length === 0) {
      setIsSubmitting(true)
      onSuccess()
      return
    }

    setError(undefined)
    setIsSubmitting(true)

    try {
      trackEvent({ ...SPACE_EVENTS.ADD_MEMBER })

      const usersToInvite = validMembers.map((member) => ({
        address: member.address,
        name: member.address,
        role: member.role,
      }))

      const result = await inviteMembers({
        spaceId: Number(spaceId),
        inviteUsersDto: { users: usersToInvite },
      })

      if (result.error) {
        // @ts-ignore
        const errorMessage = result.error?.data?.message || 'Failed to invite members. Please try again.'
        setError(errorMessage)
        setIsSubmitting(false)
        return
      }

      dispatch(
        showNotification({
          message: `Invited ${validMembers.length} member(s) to space`,
          variant: 'success',
          groupKey: 'invite-member-success',
        }),
      )

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
    fields,
    append,
    remove,
    onSubmit,
    error,
    isSubmitting,
  }
}

export default useInviteForm

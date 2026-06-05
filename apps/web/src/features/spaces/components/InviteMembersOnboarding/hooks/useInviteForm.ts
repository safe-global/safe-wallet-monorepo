import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { isAddress } from 'ethers'
import { type InviteUsersDto, useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { buildInviteUserPayload, isEmailAddress } from '../../AddMemberModal/utils'

interface MemberInvite {
  // Can be a wallet address, ENS name, or email.
  identifier: string
  role: MemberRole
}

export interface InviteMembersFormValues {
  members: MemberInvite[]
}

/**
 * The onboarding flow has no dedicated name field, so a display name is derived from the
 * identifier. Wallet/ENS invites keep using the address as the name (as before); email
 * invites use the email's local part, sanitized to the alphanumeric-ish characters the
 * backend's name validation accepts (the raw email's "@" would be rejected).
 */
export const toInviteName = (identifier: string): string => {
  if (!isEmailAddress(identifier)) return identifier

  const localPart = identifier.slice(0, identifier.indexOf('@'))
  const sanitized = localPart
    .replace(/[^a-zA-Z0-9 ._-]/g, '')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .trim()

  return sanitized || 'Member'
}

const useInviteForm = (spaceId: string | undefined, onSuccess: () => void) => {
  const [inviteMembers] = useMembersInviteUserV1Mutation()

  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const methods = useForm<InviteMembersFormValues>({
    mode: 'onChange',
    defaultValues: {
      members: [{ identifier: '', role: MemberRole.MEMBER }],
    },
  })

  const { handleSubmit, control, formState, register, setValue, trigger } = methods
  const { fields, append, remove } = useFieldArray({ control, name: 'members' })

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    const validMembers = data.members
      .map((m) => ({ ...m, identifier: m.identifier.trim() }))
      .filter((m) => m.identifier !== '')

    const hasUnresolvedNames = validMembers.some((m) => !isEmailAddress(m.identifier) && !isAddress(m.identifier))
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
      const usersToInvite: InviteUsersDto['users'] = validMembers.map((member) =>
        buildInviteUserPayload({
          name: toInviteName(member.identifier),
          inviteeIdentifier: member.identifier,
          role: member.role,
        }),
      )

      const result = await inviteMembers({
        spaceId: Number(spaceId),
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

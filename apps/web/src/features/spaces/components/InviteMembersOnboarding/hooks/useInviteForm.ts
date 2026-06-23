import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { isAddress } from 'ethers'
import { type InviteUsersDto, useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MemberRole } from '../../../hooks/useSpaceMembers'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { ALLOWED_NAME_REGEX, NAME_MIN_LENGTH, sanitizeName } from '@safe-global/utils/validation/names'
import { buildInviteUserPayload, isEmailAddress } from '../../AddMemberModal/utils'

interface MemberInvite {
  // Can be a wallet address, ENS name, or email.
  identifier: string
  role: MemberRole
}

export interface InviteMembersFormValues {
  members: MemberInvite[]
}

// Derives a display name from the identifier: wallet/ENS keep the address; emails use the
// sanitized local part (the "@" is stripped), falling back to 'Member' when too short.
export const toInviteName = (identifier: string): string => {
  if (!isEmailAddress(identifier)) return identifier

  const localPart = identifier.slice(0, identifier.indexOf('@'))
  const allowedChars = [...sanitizeName(localPart)].filter((char) => ALLOWED_NAME_REGEX.test(char)).join('')
  const sanitized = sanitizeName(allowedChars)

  return [...sanitized].length >= NAME_MIN_LENGTH ? sanitized : 'Member'
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
      onSuccess()
      return
    }

    setError(undefined)
    setIsSubmitting(true)

    // On success we hand off to onSuccess(), which navigates away and unmounts the form,
    // so the spinner stays up through the route change. On every other exit the finally
    // block resets isSubmitting so a failed/aborted submit can never leave the button stuck.
    let succeeded = false
    try {
      const usersToInvite: InviteUsersDto['users'] = validMembers.map((member) =>
        buildInviteUserPayload({
          name: toInviteName(member.identifier),
          inviteeIdentifier: member.identifier,
          role: member.role,
        }),
      )

      const result = await inviteMembers({
        spaceId,
        inviteUsersDto: { users: usersToInvite },
      })

      if (result.error) {
        setError(getRtkQueryErrorMessage(result.error) || 'Failed to invite members. Please try again.')
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

      succeeded = true
      onSuccess()
    } catch {
      setError('Something went wrong inviting members. Please try again.')
    } finally {
      if (!succeeded) setIsSubmitting(false)
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

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { isAddress } from 'ethers'
import { type InviteUsersDto, useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MemberRole } from '../../../hooks/useSpaceMembers'
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

// Mirrors the backend's name.schema NAME_MIN_LENGTH: names shorter than this are rejected.
const NAME_MIN_LENGTH = 3

/**
 * The onboarding flow has no dedicated name field, so a display name is derived from the
 * identifier. Wallet/ENS invites keep using the address as the name (as before); email
 * invites use the email's local part, sanitized to the alphanumeric-ish characters the
 * backend's name validation accepts (the raw email's "@" would be rejected). A local part
 * shorter than the backend minimum (e.g. "r@cc0x.dev") falls back to a default name so the
 * invite isn't rejected for a too-short name.
 */
export const toInviteName = (identifier: string): string => {
  if (!isEmailAddress(identifier)) return identifier

  const localPart = identifier.slice(0, identifier.indexOf('@'))
  const sanitized = localPart
    .replace(/[^a-zA-Z0-9 ._-]/g, '')
    .replace(/^[^a-zA-Z0-9]+/, '')
    .trim()

  return sanitized.length >= NAME_MIN_LENGTH ? sanitized : 'Member'
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

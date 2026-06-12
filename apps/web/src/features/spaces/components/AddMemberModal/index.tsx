import { type ReactElement, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import memberIcon from '@/public/images/spaces/member.svg'
import adminIcon from '@/public/images/spaces/admin.svg'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import css from './styles.module.css'
import { useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, MemberRole } from '@/features/spaces'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import MemberInfoForm from './MemberInfoForm'
import AddressBookInput from '@/components/common/AddressBookInput'
import useAddressBook from '@/hooks/useAddressBook'

type MemberField = {
  name: string
  address: string
  role: MemberRole
}

export const RoleMenuItem = ({
  role,
  hasDescription = false,
}: {
  role: MemberRole
  hasDescription?: boolean
}): ReactElement => {
  const isAdmin = role === MemberRole.ADMIN
  const Icon = isAdmin ? adminIcon : memberIcon

  return (
    <div className={cn('w-full items-center', css.roleMenuItem)}>
      <div className="flex items-center" style={{ gridArea: 'icon' }}>
        <Icon className="size-4" />
      </div>
      <Typography variant={hasDescription ? 'paragraph-bold' : 'paragraph'} style={{ gridArea: 'title' }}>
        {isAdmin ? 'Admin' : 'Member'}
      </Typography>
      {hasDescription && (
        <div style={{ gridArea: 'description' }}>
          <Typography variant="paragraph-small" className="max-w-[300px] break-words whitespace-normal">
            {isAdmin
              ? 'Admins can create and delete workspaces, invite members, and more.'
              : 'Can view the workspace data.'}
          </Typography>
        </div>
      )}
    </div>
  )
}

const AddMemberModal = ({ onClose }: { onClose: () => void }): ReactElement => {
  const spaceId = useCurrentSpaceId()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteMembers] = useMembersInviteUserV1Mutation()
  const addressBook = useAddressBook()
  const isDarkMode = useDarkMode()

  const methods = useForm<MemberField>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      address: '',
      role: MemberRole.MEMBER,
    },
  })

  const { handleSubmit, formState, watch, setValue } = methods

  const addressValue = watch('address')

  useEffect(() => {
    const addressBookName = addressBook[addressValue]
    if (addressBookName) {
      setValue('name', addressBookName)
    }
  }, [addressBook, addressValue, setValue])

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    if (!spaceId) {
      setError('Something went wrong. Please try again.')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await inviteMembers({
        spaceId: String(spaceId),
        inviteUsersDto: { users: [{ type: 'wallet', address: data.address, role: data.role, name: data.name }] },
      })

      if (response.data) {
        response.data.forEach((invitation) => {
          trackEvent(
            { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: spaceId },
            { workspace_id: spaceId, user_id: invitation.userId, role: invitation.role.toLowerCase() },
          )
        })

        if (router.pathname !== AppRoutes.spaces.members) {
          router.push({ pathname: AppRoutes.spaces.members, query: { spaceId } })
        }

        dispatch(
          showNotification({
            message: `Invited ${data.name} to space`,
            variant: 'success',
            groupKey: 'invite-member-success',
          }),
        )

        onClose()
      }
      if (response.error) {
        // @ts-ignore
        const errorMessage = response.error?.data?.message || 'Invite failed. Please try again.'
        setError(errorMessage)
      }
    } catch (e) {
      console.error(e)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <ModalDialog open onClose={onClose} dialogTitle="Add member" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4">
              <Typography variant="paragraph" className="mb-4">
                Invite a signer of the Safe Accounts, or any other wallet address. Anyone in the workspace can see their
                name.
              </Typography>

              <div className="flex flex-col gap-6">
                <MemberInfoForm />

                <AddressBookInput
                  data-testid="member-address-input"
                  name="address"
                  label="Address"
                  required
                  showPrefix={false}
                />
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 pb-6">
              <Button variant="ghost" data-testid="cancel-btn" onClick={onClose}>
                Cancel
              </Button>
              <Button data-testid="add-member-modal-button" type="submit" disabled={!formState.isValid || isSubmitting}>
                {isSubmitting ? <Spinner className="size-5" /> : 'Add member'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </ModalDialog>
  )
}

export default AddMemberModal

import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { isAddress } from 'ethers'
import { blo } from 'blo'
import { useMembersInviteUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { validateAddress } from '@safe-global/utils/utils/validation'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AppRoutes } from '@/config/routes'
import useWallet from '@/hooks/wallets/useWallet'
import { MemberRole } from '@/features/spaces/hooks/useSpaceMembers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import StepIndicator from '@/features/spaces/components/StepIndicator'

const ONBOARDING_STEP = 3
const TOTAL_STEPS = 4

const ROLE_LABELS: Record<MemberRole, string> = {
  [MemberRole.ADMIN]: 'Admin',
  [MemberRole.MEMBER]: 'Member',
}

interface MemberInvite {
  address: string
  role: MemberRole
}

interface InviteMembersFormValues {
  members: MemberInvite[]
}

interface MemberInviteRowProps {
  index: number
  control: ReturnType<typeof useForm<InviteMembersFormValues>>['control']
  register: ReturnType<typeof useForm<InviteMembersFormValues>>['register']
  canRemove: boolean
  onRemove: () => void
}

const IDENTICON_SIZE = 32

const AddressIdenticon = ({ address }: { address: string }) => {
  const style = useMemo(() => {
    try {
      if (!isAddress(address)) return null
      return {
        backgroundImage: `url(${blo(address as `0x${string}`)})`,
        width: `${IDENTICON_SIZE}px`,
        height: `${IDENTICON_SIZE}px`,
      }
    } catch {
      return null
    }
  }, [address])

  if (!style) {
    return <div className="size-8 shrink-0 rounded-full bg-muted" />
  }

  return <div className="size-8 shrink-0 rounded-full bg-cover" style={style} />
}

const MemberInviteRow = ({ index, control, register, canRemove, onRemove }: MemberInviteRowProps) => {
  const addressValue = useWatch({ control, name: `members.${index}.address` })

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <AddressIdenticon address={addressValue || ''} />
        </div>
        <Input
          {...register(`members.${index}.address`, {
            required: index === 0,
            validate: (value) => {
              if (!value.trim()) return undefined
              return validateAddress(value)
            },
          })}
          placeholder="Type wallet address"
          className="h-11 rounded-lg bg-card pl-12 pr-4"
          data-testid={`invite-address-input-${index}`}
        />
      </div>

      <Controller
        control={control}
        name={`members.${index}.role`}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="h-11 min-w-[120px] rounded-lg bg-card">
              <SelectValue placeholder="Role">{ROLE_LABELS[field.value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MemberRole.ADMIN}>{ROLE_LABELS[MemberRole.ADMIN]}</SelectItem>
              <SelectItem value={MemberRole.MEMBER}>{ROLE_LABELS[MemberRole.MEMBER]}</SelectItem>
            </SelectContent>
          </Select>
        )}
      />

      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove member"
          data-testid={`remove-member-${index}`}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}

const InviteMembersOnboarding = (): ReactElement => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const spaceId = router.query.spaceId as string | undefined

  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteMembers] = useMembersInviteUserV1Mutation()

  const methods = useForm<InviteMembersFormValues>({
    mode: 'onChange',
    defaultValues: {
      members: [{ address: '', role: MemberRole.MEMBER }],
    },
  })

  const { handleSubmit, control, formState, register } = methods
  const { fields, append, remove } = useFieldArray({ control, name: 'members' })

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const redirectToNextStep = () => {
    router.push({ pathname: AppRoutes.welcome.addressBook, query: { spaceId } })
  }

  const goBack = () => {
    router.push({ pathname: AppRoutes.welcome.selectSafes, query: { spaceId } })
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!spaceId) return

    const validMembers = data.members.filter((m) => m.address.trim() !== '')
    if (validMembers.length === 0) {
      redirectToNextStep()
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
        return
      }

      dispatch(
        showNotification({
          message: `Invited ${validMembers.length} member(s) to space`,
          variant: 'success',
          groupKey: 'invite-member-success',
        }),
      )

      redirectToNextStep()
    } catch {
      setError('Something went wrong inviting members. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  if (!wallet || !isUserAuthenticated || !spaceId) {
    return <></>
  }

  return (
    <div className="shadcn-scope">
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <form onSubmit={onSubmit} className="flex w-full max-w-[350px] flex-col gap-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="rounded-md border border-card shadow-sm"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <div className="flex items-center justify-center">
            <StepIndicator currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />
          </div>

          <h2 className="w-full text-center text-[30px] font-semibold leading-[30px] tracking-[-1px] text-foreground">
            Invite team members
          </h2>

          <p className="mx-auto w-[93%] text-center text-base leading-6 text-muted-foreground">
            Add people to collaborate on this space.
          </p>

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <MemberInviteRow
                key={field.id}
                index={index}
                control={control}
                register={register}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ address: '', role: MemberRole.MEMBER })}
            className="flex items-center justify-center gap-2 text-sm font-medium text-foreground"
            data-testid="add-another-member"
          >
            <Plus className="size-4" />
            Add another
          </button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            data-testid="invite-members-continue-button"
            type="submit"
            size="lg"
            disabled={!formState.isValid || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? <Spinner /> : 'Continue'}
          </Button>

          <Button
            data-testid="invite-members-skip-button"
            type="button"
            variant="ghost"
            size="lg"
            onClick={redirectToNextStep}
            disabled={isSubmitting}
            className="w-full"
          >
            Skip
          </Button>
        </form>
      </div>
    </div>
  )
}

export default InviteMembersOnboarding

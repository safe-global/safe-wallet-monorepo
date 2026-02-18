import { useEffect, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { useFieldArray, useForm } from 'react-hook-form'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { validateAddress } from '@safe-global/utils/utils/validation'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { trackEvent } from '@/services/analytics'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import { AppRoutes } from '@/config/routes'
import useWallet from '@/hooks/wallets/useWallet'
import useChainId from '@/hooks/useChainId'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import StepIndicator from '@/components/onboarding/StepIndicator'

const ONBOARDING_STEP = 4
const TOTAL_STEPS = 4
const NAME_MAX_LENGTH = 50

interface AddressBookEntry {
  name: string
  address: string
}

interface AddressBookFormValues {
  entries: AddressBookEntry[]
}

interface AddressBookEntryRowProps {
  index: number
  register: ReturnType<typeof useForm<AddressBookFormValues>>['register']
  errors: ReturnType<typeof useForm<AddressBookFormValues>>['formState']['errors']
  canRemove: boolean
  onRemove: () => void
}

const AddressBookEntryRow = ({ index, register, errors, canRemove, onRemove }: AddressBookEntryRowProps) => {
  const entryErrors = errors.entries?.[index]

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          {...register(`entries.${index}.name`, {
            maxLength: { value: NAME_MAX_LENGTH, message: `Max ${NAME_MAX_LENGTH} characters` },
          })}
          placeholder="Name"
          className="h-11 min-w-0 flex-1 rounded-lg bg-card px-4"
          data-testid={`address-book-name-input-${index}`}
        />

        <Input
          {...register(`entries.${index}.address`, {
            validate: (value) => {
              if (!value.trim()) return undefined
              return validateAddress(value)
            },
          })}
          placeholder="Address"
          className="h-11 min-w-0 flex-[2] rounded-lg bg-card px-4"
          data-testid={`address-book-address-input-${index}`}
        />

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label="Remove entry"
            data-testid={`remove-entry-${index}`}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {entryErrors?.name && (
        <span className="text-xs text-destructive" data-testid={`name-error-${index}`}>
          {entryErrors.name.message}
        </span>
      )}
      {entryErrors?.address && (
        <span className="text-xs text-destructive" data-testid={`address-error-${index}`}>
          {entryErrors.address.message}
        </span>
      )}
    </div>
  )
}

const AddAddressBookOnboarding = (): ReactElement => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const wallet = useWallet()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const chainId = useChainId()
  const spaceId = router.query.spaceId as string | undefined

  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    handleSubmit,
    control,
    formState: { errors },
    register,
  } = useForm<AddressBookFormValues>({
    mode: 'onChange',
    defaultValues: {
      entries: [{ name: '', address: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'entries' })

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  const redirectToSpaceDashboard = () => {
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }

  const goBack = () => {
    router.push({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId } })
  }

  const onSubmit = handleSubmit((data) => {
    const validEntries = data.entries.filter((entry) => entry.name.trim() !== '' && entry.address.trim() !== '')

    if (validEntries.length === 0) {
      redirectToSpaceDashboard()
      return
    }

    setIsSubmitting(true)

    validEntries.forEach((entry) => {
      trackEvent({ ...ADDRESS_BOOK_EVENTS.CREATE_ENTRY })
      dispatch(upsertAddressBookEntries({ chainIds: [chainId], address: entry.address, name: entry.name.trim() }))
    })

    dispatch(
      showNotification({
        message: `Added ${validEntries.length} address book ${validEntries.length === 1 ? 'entry' : 'entries'}`,
        variant: 'success',
        groupKey: 'address-book-onboarding-success',
      }),
    )

    redirectToSpaceDashboard()
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
            Add to address book
          </h2>

          <p className="mx-auto w-[93%] text-center text-base leading-6 text-muted-foreground">
            Save frequently used addresses for quick access.
          </p>

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <AddressBookEntryRow
                key={field.id}
                index={index}
                register={register}
                errors={errors}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => append({ name: '', address: '' })}
            className="flex items-center justify-center gap-2 text-sm font-medium text-foreground"
            data-testid="add-another-entry"
          >
            <Plus className="size-4" />
            Add another
          </button>

          <Button
            data-testid="address-book-continue-button"
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full"
          >
            Continue
          </Button>

          <Button
            data-testid="address-book-skip-button"
            type="button"
            variant="ghost"
            size="lg"
            onClick={redirectToSpaceDashboard}
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

export default AddAddressBookOnboarding

import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  OnboardingLayout,
  StepCounter,
  SafeAppMockup,
  deriveSidePanelAccountsFromSpace,
  useSafeNameLookup,
} from '../OnboardingLayout'
import { useIsCheckingAccess } from '@/hooks/useRouterGuard'
import { flattenSafeItems } from '@/hooks/safes'
import { useSpaceSafes } from '../../hooks/useSpaceSafes'
import { useOnboardingStepCount } from '../../hooks/useOnboardingStepCount'
import useExistingSpace from './hooks/useExistingSpace'
import useSpaceSubmit from './hooks/useSpaceSubmit'
import useOnboardingExit from './hooks/useOnboardingExit'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'

const ONBOARDING_STEP = 1
const FORM_ID = 'create-space-form'

const CreateSpaceOnboarding = (): ReactElement => {
  const totalSteps = useOnboardingStepCount()
  const isCheckingAccess = useIsCheckingAccess() ?? true

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, errors },
    setValue,
    setFocus,
  } = useForm<{ name: string }>({ mode: 'onChange', defaultValues: { name: '' } })

  const { spaceId, isEditMode, isSpaceLoading, existingSpace } = useExistingSpace(setValue)
  const { onExit, hasNoSpaces } = useOnboardingExit(isEditMode)
  const { error, isSubmitting, onSubmit } = useSpaceSubmit(handleSubmit, spaceId, isEditMode)
  const watchedName = useWatch({ control, name: 'name' }) ?? ''

  // Tracks whether the user has typed in the input at least once. We can't use
  // formState.isDirty for this: RHF resets isDirty to false when the current value
  // matches the default ('' === ''), so typing "abc" then deleting it back to ''
  // would incorrectly look like a fresh form, falling through to the existingSpace
  // fallback and re-asserting the highlight after the user explicitly cleared it.
  const [hasUserEdited, setHasUserEdited] = useState(false)
  const nameReg = register('name', {
    required: true,
    maxLength: {
      value: SPACE_NAME_MAX_LENGTH,
      message: `Workspace name must be ${SPACE_NAME_MAX_LENGTH} characters or less`,
    },
    pattern: { value: /^[a-zA-Z0-9 ]+$/, message: 'Workspace name must not contain special characters' },
    validate: (value) => value?.trim() !== '',
  })

  const isInputDisabled = isCheckingAccess || isSpaceLoading
  useEffect(() => {
    if (!isEditMode && !isInputDisabled) {
      setFocus('name')
    }
  }, [isEditMode, isInputDisabled, setFocus])

  // spaceId gate avoids leaking lastUsedSpace's safes into a fresh "create" landing.
  const { allSafes } = useSpaceSafes()
  const nameLookup = useSafeNameLookup()
  const sidePanelAccounts = useMemo(
    () => (spaceId ? deriveSidePanelAccountsFromSpace(allSafes, nameLookup) : []),
    [spaceId, allSafes, nameLookup],
  )
  const balanceSafes = useMemo(() => (spaceId ? flattenSafeItems(allSafes) : []), [spaceId, allSafes])
  const trimmedWatched = watchedName.trim()
  const trimmedExisting = existingSpace?.name?.trim() ?? ''
  const displayName = hasUserEdited ? watchedName : watchedName || existingSpace?.name || ''
  const isFilled = hasUserEdited ? trimmedWatched.length > 0 : trimmedWatched.length > 0 || trimmedExisting.length > 0

  const main = (
    <>
      <StepCounter currentStep={ONBOARDING_STEP} totalSteps={totalSteps} />

      <div className="flex flex-col gap-2">
        <Typography variant="h2">Create a Workspace</Typography>
        <Typography variant="paragraph" color="muted">
          Your team&apos;s home for managing Safes, tracking activity, and collaborating.
        </Typography>
      </div>

      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="relative">
          <label htmlFor="space-name" className="m-0 text-sm leading-5 font-medium">
            Workspace name
          </label>
          <Input
            id="space-name"
            data-testid="space-name-input"
            placeholder="e.g. Treasury Ops, DeFi Team"
            autoComplete="off"
            disabled={isInputDisabled}
            className="mt-2 h-11 rounded-sm bg-card px-4"
            {...nameReg}
            onChange={(e) => {
              setHasUserEdited(true)
              nameReg.onChange(e)
            }}
            error={errors.name?.message}
            onBlur={(e) => {
              nameReg.onBlur(e)
              setValue('name', e.target.value.trim(), { shouldValidate: true })
            }}
          />
          {isSpaceLoading && (
            <div className="absolute right-3 top-[2.4rem]">
              <Spinner className="size-4" />
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </>
  )

  const footer = (
    <div className="flex flex-col-reverse gap-3 xl:flex-row xl:items-center">
      <Button
        type="button"
        variant="secondary"
        onClick={onExit}
        disabled={isSubmitting}
        className="h-12 w-full rounded-lg xl:flex-1"
      >
        <ChevronLeft className="size-4 mr-1" />
        Back
      </Button>
      <Button
        data-testid="create-space-onboarding-continue-button"
        type="submit"
        form={FORM_ID}
        disabled={!isValid || isSubmitting || isCheckingAccess || isSpaceLoading}
        className="w-full h-12 rounded-lg text-base xl:flex-1"
      >
        {isSubmitting ? (
          <Spinner />
        ) : (
          <>
            Next
            <ChevronRight className="size-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  )

  return (
    <OnboardingLayout
      main={main}
      footer={footer}
      onLogoClick={hasNoSpaces ? onExit : undefined}
      sidePanel={
        <SafeAppMockup
          name={displayName}
          highlight={isFilled ? 'switcher' : 'none'}
          accounts={sidePanelAccounts}
          balanceSafes={balanceSafes}
        />
      }
    />
  )
}

export default CreateSpaceOnboarding

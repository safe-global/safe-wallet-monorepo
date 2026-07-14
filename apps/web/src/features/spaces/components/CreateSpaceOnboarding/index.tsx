import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import OnboardingFooter from '@/components/common/OnboardingFooter'
import { Input } from '@/components/ui/input'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
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
import { NAME_MIN_LENGTH, sanitizeName, validateName } from '@safe-global/utils/validation/names'

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
    validate: (value) => {
      const sanitized = sanitizeName(value ?? '')
      if (sanitized === '') return 'Required'
      return validateName(sanitized, { minLength: NAME_MIN_LENGTH, maxLength: SPACE_NAME_MAX_LENGTH }) ?? true
    },
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
            variant="surface"
            // eslint-disable-next-line no-restricted-syntax -- bespoke 44px onboarding field (h-11, rounded-sm, px-4); between the lg/xl tiers, no size fits
            className="mt-2 h-11 rounded-sm px-4"
            {...nameReg}
            onChange={(e) => {
              setHasUserEdited(true)
              nameReg.onChange(e)
            }}
            error={errors.name?.message}
            onBlur={(e) => {
              nameReg.onBlur(e)
              setValue('name', sanitizeName(e.target.value), { shouldValidate: true })
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
    <OnboardingFooter
      onBack={onExit}
      backDisabled={isSubmitting}
      continueLabel="Next"
      continueType="submit"
      continueForm={FORM_ID}
      continueDisabled={!isValid || isSubmitting || isCheckingAccess || isSpaceLoading}
      continueLoading={isSubmitting}
      continueTestId="create-space-onboarding-continue-button"
    />
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

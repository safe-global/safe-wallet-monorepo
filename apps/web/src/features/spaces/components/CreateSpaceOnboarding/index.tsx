import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import ClaimTrialModal from '../Plans/ClaimTrialModal'
import { useWorkspaceLock } from '../../hooks/useWorkspaceLock'
import { useStepUpReturnUrl } from '@/features/oidc-auth'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'
import { NAME_MIN_LENGTH, sanitizeName, validateName } from '@safe-global/utils/validation/names'
import {
  CreateSpaceOnboardingFooterView,
  CreateSpaceOnboardingView,
} from '@views/features/spaces/components/CreateSpaceOnboarding/CreateSpaceOnboardingView'

const ONBOARDING_STEP = 1

const CreateSpaceOnboarding = (): ReactElement => {
  const router = useRouter()
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
  const { error, isSubmitting, onSubmit, createdSpaceId, goToSelectSafes, selectSafesUrl } = useSpaceSubmit(
    handleSubmit,
    spaceId,
    isEditMode,
  )
  // The new Workspace is offered its trial right here; without an offer the wizard moves on to the Safes step.
  const trialLock = useWorkspaceLock(createdSpaceId ?? null)
  const offersTrial = Boolean(createdSpaceId) && trialLock.isLocked && trialLock.reason === 'trial-offered'
  const isTrialCheckFailed = Boolean(createdSpaceId) && trialLock.isError
  // The page reloads after a step-up and loses the created Workspace, so the challenge returns to its Safes step.
  useStepUpReturnUrl(offersTrial ? selectSafesUrl : undefined)
  useEffect(() => {
    if (createdSpaceId && !trialLock.isResolving && !trialLock.isError && !offersTrial) goToSelectSafes(createdSpaceId)
  }, [createdSpaceId, trialLock.isResolving, trialLock.isError, offersTrial, goToSelectSafes])
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

  const isInputDisabled = isCheckingAccess || isSpaceLoading || Boolean(createdSpaceId)
  useEffect(() => {
    if (!isEditMode && !isInputDisabled) {
      setFocus('name')
    }
  }, [isEditMode, isInputDisabled, setFocus])

  // spaceId gate avoids leaking landingSpaceHint's safes into a fresh "create" landing.
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
    <CreateSpaceOnboardingView
      showClaimTrial={Boolean(offersTrial && createdSpaceId)}
      renderClaimTrialModal={(props) => (
        <ClaimTrialModal
          {...props}
          spaceId={createdSpaceId!}
          returnPathname={AppRoutes.welcome.selectSafes}
          onBack={() => router.push(AppRoutes.welcome.accounts)}
        />
      )}
      stepCounter={<StepCounter currentStep={ONBOARDING_STEP} totalSteps={totalSteps} />}
      onSubmit={onSubmit}
      nameReg={nameReg}
      onNameChange={(e) => {
        setHasUserEdited(true)
        nameReg.onChange(e)
      }}
      onNameBlur={(e) => {
        nameReg.onBlur(e)
        setValue('name', sanitizeName(e.target.value), { shouldValidate: true })
      }}
      isInputDisabled={isInputDisabled}
      nameError={errors.name?.message}
      isSpaceLoading={isSpaceLoading}
      error={error}
      isTrialCheckFailed={isTrialCheckFailed}
      onRetryTrialCheck={trialLock.retry}
    />
  )

  const footer = (
    <CreateSpaceOnboardingFooterView
      onBack={onExit}
      backDisabled={isSubmitting}
      continueDisabled={!isValid || isSubmitting || isCheckingAccess || isSpaceLoading || Boolean(createdSpaceId)}
      continueLoading={isSubmitting || (Boolean(createdSpaceId) && trialLock.isResolving)}
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

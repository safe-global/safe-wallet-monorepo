import { useEffect, useRef, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { skipToken } from '@reduxjs/toolkit/query'
import { useSpacesGetOneV1Query, useSpacesGetSetupV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SetupProgress from '@safe-global/views/features/spaces/components/WorkspaceWizard/SetupProgress'
import { AppRoutes } from '@/config/routes'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useAppDispatch } from '@/store'
import { wizardLeft, wizardStepOpened } from '@/features/spaces/store'
import { CHECKOUT_SESSION_QUERY_PARAM } from '../../hooks/billing/returnUrl'
import CheckoutReturnScreen from './CheckoutReturnScreen'
import { useTrialSizes } from './hooks/useTrialSizes'
import { useWizardNavigation } from './hooks/useWizardNavigation'
import { useWorkspaceDraft } from './hooks/useWorkspaceDraft'
import { fromSetup } from './setupRequest'
import { WIZARD_STEPS, type WizardStepId } from './steps'
import { findFirstInvalidStep } from './validation'
import InviteStep from './steps/InviteStep'
import NameStep from './steps/NameStep'
import PlanStep from './steps/PlanStep'
import SafesStep from './steps/SafesStep'
import SurveyStep from './steps/SurveyStep'

const STEP_COMPONENTS: Record<WizardStepId, () => ReactElement> = {
  name: NameStep,
  plan: PlanStep,
  safes: SafesStep,
  invite: InviteStep,
  survey: SurveyStep,
}

const queryString = (value: string | string[] | undefined): string | null => (typeof value === 'string' ? value : null)

const WIZARD_ROUTES = new Set(WIZARD_STEPS.map((step) => step.route))

/** Leaving the wizard makes the next visit a new start, so its first step offers the saved draft again. */
const useResumeOfferResetOnLeave = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  useEffect(() => {
    const onRouteChangeStart = (url: string) => {
      const pathname = url.split(/[?#]/)[0]
      if (!WIZARD_ROUTES.has(pathname)) dispatch(wizardLeft())
    }
    router.events.on('routeChangeStart', onRouteChangeStart)
    return () => router.events.off('routeChangeStart', onRouteChangeStart)
  }, [router.events, dispatch])
}

/** Loads the pending setup of the Workspace in the URL into the draft. */
export const useResumeSetup = (spaceId: string | null, isReturning: boolean) => {
  const router = useRouter()
  const { draft, update, isReady } = useWorkspaceDraft()
  const needsLoad = Boolean(spaceId) && !isReturning && isReady && draft.createdSpaceId !== spaceId
  const args = needsLoad && spaceId ? { id: spaceId } : skipToken
  const setup = useSpacesGetSetupV1Query(args)
  const space = useSpacesGetOneV1Query(args)

  useEffect(() => {
    if (!needsLoad || !spaceId || !setup.data || !space.data) return
    if (setup.data.status === 'applied') {
      void router.replace({ pathname: AppRoutes.spaces.index, query: { spaceId } })
      return
    }
    update(fromSetup(setup.data, space.data.name, spaceId))
  }, [needsLoad, spaceId, setup.data, space.data, update, router])

  return {
    isResuming: needsLoad,
    isError: needsLoad && (setup.isError || space.isError),
    retry: () => {
      void setup.refetch()
      void space.refetch()
    },
  }
}

/** A deep link or a resumed draft lands on the first earlier step that still misses data. */
const useFirstInvalidStepRedirect = (step: WizardStepId, isActive: boolean) => {
  const { draft, isReady } = useWorkspaceDraft()
  const { steps, goTo } = useWizardNavigation(step)
  const isSafePro = useIsSafeProEnabled()
  const { sizes } = useTrialSizes()
  // With Safe Pro the plan is checked against the offer too, so a plan that is no longer sold reopens the plan step.
  const isContextReady = !isSafePro || sizes !== undefined
  // Checked once when a step opens, not again on every change saved to the draft.
  const checkedStep = useRef<WizardStepId>(undefined)

  useEffect(() => {
    if (!isActive || !isReady || !isContextReady || checkedStep.current === step) return
    checkedStep.current = step
    const index = steps.findIndex((candidate) => candidate.id === step)
    const invalid = index > 0 ? findFirstInvalidStep(steps.slice(0, index), draft, { sizes }) : undefined
    if (invalid) goTo(invalid, 'replace')
  }, [isActive, isReady, isContextReady, step, steps, draft, sizes, goTo])
}

const WorkspaceWizard = ({ step }: { step: WizardStepId }): ReactElement => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { draft } = useWorkspaceDraft()
  const sessionId = queryString(router.query[CHECKOUT_SESSION_QUERY_PARAM])
  const urlSpaceId = queryString(router.query.spaceId)
  const resume = useResumeSetup(urlSpaceId, sessionId !== null)
  useFirstInvalidStepRedirect(step, sessionId === null && !resume.isResuming)
  useResumeOfferResetOnLeave()

  useEffect(() => {
    dispatch(wizardStepOpened(step === 'name'))
  }, [dispatch, step])

  if (sessionId) return <CheckoutReturnScreen sessionId={sessionId} spaceId={urlSpaceId ?? draft.createdSpaceId} />

  if (resume.isError) {
    return (
      <SetupProgress
        isWorking={false}
        title="We couldn't load your Workspace"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={resume.retry}
      />
    )
  }
  if (resume.isResuming) return <SetupProgress isWorking title="Loading your Workspace" />

  const Step = STEP_COMPONENTS[step]
  return <Step />
}

export default WorkspaceWizard

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
import WizardReady from './WizardReady'
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

/**
 * Whether the first step may offer the saved draft: opening a step updates the offer, and leaving the wizard makes the
 * next visit a new start.
 */
const useResumeOffer = (step: WizardStepId) => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(wizardStepOpened(step === 'name'))
  }, [dispatch, step])

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
const useFirstInvalidStepRedirect = (step: WizardStepId) => {
  const { draft } = useWorkspaceDraft()
  const { steps, goTo } = useWizardNavigation(step)
  const isSafePro = useIsSafeProEnabled()
  const { sizes } = useTrialSizes()
  // With Safe Pro the plan is checked against the offer too, so a plan that is no longer sold reopens the plan step.
  const isContextReady = !isSafePro || sizes !== undefined
  // Checked once when a step opens, not again on every change saved to the draft.
  const checkedStep = useRef<WizardStepId>(undefined)

  useEffect(() => {
    if (!isContextReady || checkedStep.current === step) return
    checkedStep.current = step
    const index = steps.findIndex((candidate) => candidate.id === step)
    const invalid = index > 0 ? findFirstInvalidStep(steps.slice(0, index), draft, { sizes }) : undefined
    if (invalid) goTo(invalid, 'replace')
  }, [isContextReady, step, steps, draft, sizes, goTo])
}

/** The step itself; mounted once the draft and the steps are known, so its form starts from the draft. */
const WizardStepPage = ({ step }: { step: WizardStepId }): ReactElement => {
  useFirstInvalidStepRedirect(step)
  const Step = STEP_COMPONENTS[step]
  return <Step />
}

const WorkspaceWizard = ({ step }: { step: WizardStepId }): ReactElement => {
  const router = useRouter()
  const { draft } = useWorkspaceDraft()
  const sessionId = queryString(router.query[CHECKOUT_SESSION_QUERY_PARAM])
  const urlSpaceId = queryString(router.query.spaceId)
  const resume = useResumeSetup(urlSpaceId, sessionId !== null)
  useResumeOffer(step)

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

  return (
    <WizardReady>
      <WizardStepPage step={step} />
    </WizardReady>
  )
}

export default WorkspaceWizard

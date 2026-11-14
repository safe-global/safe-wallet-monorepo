import { useState, type ReactElement } from 'react'
import {
  useSurveysGetActiveSurveyV1Query,
  type SurveyOptionDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/surveys'
import OnboardingFooter from '@safe-global/views/components/common/OnboardingFooter'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import SurveyOptionCard from '@safe-global/views/features/spaces/components/SurveyOnboarding/SurveyOptionCard'
import { isSurveyNotFound, ONBOARDING_SURVEY_SLUG, surveyIcon } from '../../SurveyOnboarding/survey'
import { useStepAdvance } from '../hooks/useStepAdvance'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'
import TrialConfirmNote from '../TrialConfirmNote'
import WizardFrame from '../WizardFrame'

const SurveyStep = (): ReactElement => {
  const { draft } = useWorkspaceDraft()
  const { stepNumber, totalSteps, advance, retreat, continueLabel, submitError, isSubmitting, isLastStep } =
    useStepAdvance('survey')
  const { data: survey, isLoading, error } = useSurveysGetActiveSurveyV1Query({ slug: ONBOARDING_SURVEY_SLUG })
  const page = survey?.surveyContent.pages[0]
  // Without an active survey there is nothing to answer, and the step only confirms the trial.
  const hasNoSurvey = isSurveyNotFound(error)
  const [picked, setPicked] = useState<string[]>()
  const selected = new Set(picked ?? (page ? (draft.surveySelections[page.id] ?? []) : []))

  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setPicked(Array.from(next))
  }

  const answers = () => (page ? { surveySelections: { [page.id]: Array.from(selected) } } : {})

  return (
    <WizardFrame
      draft={draft}
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      title={page?.title ?? 'How will you use Safe?'}
      subtitle={page?.subtitle ?? "Select all that apply. We'll tailor your setup."}
      highlight="accounts"
      footer={
        <OnboardingFooter
          onBack={() => retreat(answers())}
          backDisabled={isSubmitting}
          continueLabel={continueLabel}
          onContinue={() => advance(answers())}
          continueDisabled={isSubmitting || (!hasNoSurvey && selected.size === 0)}
          continueLoading={isSubmitting}
          continueTestId="survey-finish-button"
        />
      }
    >
      {isLoading && <Spinner />}

      {error && !hasNoSurvey && (
        <Alert variant="destructive">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>Failed to load survey. Please refresh.</AlertDescription>
        </Alert>
      )}

      {page?.options && (
        <div className="grid auto-rows-fr grid-cols-2 gap-3 xl:grid-cols-3">
          {page.options.map((option: SurveyOptionDto) => (
            <SurveyOptionCard
              key={option.key}
              option={option}
              Icon={surveyIcon(option.icon)}
              isPressed={selected.has(option.key)}
              onToggle={toggle}
            />
          ))}
        </div>
      )}

      {submitError && (
        <Alert variant="destructive">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {isLastStep && <TrialConfirmNote />}
    </WizardFrame>
  )
}

export default SurveyStep

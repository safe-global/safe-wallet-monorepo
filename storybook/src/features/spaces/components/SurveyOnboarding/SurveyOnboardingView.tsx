import type { ReactElement, ReactNode } from 'react'
import { ArrowLeftRight, BarChart3, FileCode, HelpCircle, Send, Shield, Sparkles, type LucideIcon } from 'lucide-react'
import type { SurveyOptionDto, SurveyPageDto } from '@safe-global/store/gateway/AUTO_GENERATED/surveys'
import OnboardingFooter from '@/components/common/OnboardingFooter'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import SurveyOptionCard from './SurveyOptionCard'

// Backend-issued icon keys → lucide icons. Unknown keys fall back to a
// placeholder so the card never renders iconless.
const ICON_MAP: Record<string, LucideIcon> = {
  terminal: FileCode,
  gift: Sparkles,
  cash: Send,
  sprout: BarChart3,
  swap: ArrowLeftRight,
  bank: Shield,
}
const FALLBACK_ICON: LucideIcon = HelpCircle

export type SurveyOnboardingViewProps = {
  page?: SurveyPageDto
  stepCounter: ReactNode
  isLoading: boolean
  hasLoadError: boolean
  hasSubmitError: boolean
  selected: Set<string>
  onToggle: (key: string) => void
  onBack: () => void
  onFinish: () => void
  isSubmitting: boolean
  canFinish: boolean
  renderLayout: (slots: { main: ReactNode; footer: ReactNode }) => ReactElement
}

export const SurveyOnboardingView = ({
  page,
  stepCounter,
  isLoading,
  hasLoadError,
  hasSubmitError,
  selected,
  onToggle,
  onBack,
  onFinish,
  isSubmitting,
  canFinish,
  renderLayout,
}: SurveyOnboardingViewProps): ReactElement => {
  const main = (
    <div className="flex flex-col gap-6">
      {stepCounter}

      <div className="flex flex-col gap-2">
        <Typography variant="h2" id="survey-page-title">
          {page?.title ?? 'How will you use Safe?'}
        </Typography>
        <Typography variant="paragraph" color="muted">
          {page?.subtitle ?? "Select all that apply. We'll tailor your setup."}
        </Typography>
      </div>

      {isLoading && <Spinner />}

      {hasLoadError && (
        <Alert variant="destructive">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>Failed to load survey. Please refresh.</AlertDescription>
        </Alert>
      )}

      {page?.options && (
        <div className="grid auto-rows-fr grid-cols-2 gap-3 xl:grid-cols-3">
          {page.options.map((opt: SurveyOptionDto) => (
            <SurveyOptionCard
              key={opt.key}
              option={opt}
              Icon={opt.icon ? (ICON_MAP[opt.icon] ?? FALLBACK_ICON) : undefined}
              isPressed={selected.has(opt.key)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}

      {hasSubmitError && (
        <Alert variant="destructive">
          <AlertSeverityIcon variant="destructive" />
          <AlertDescription>Failed to submit. Please try again.</AlertDescription>
        </Alert>
      )}
    </div>
  )

  const footer = (
    <OnboardingFooter
      onBack={onBack}
      backDisabled={isSubmitting}
      continueLabel="Create Workspace"
      continueType="button"
      onContinue={onFinish}
      continueDisabled={!canFinish || isSubmitting}
      continueLoading={isSubmitting}
      continueTestId="survey-finish-button"
    />
  )

  return renderLayout({ main, footer })
}

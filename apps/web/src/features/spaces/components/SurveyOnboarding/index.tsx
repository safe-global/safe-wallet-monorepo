import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeftRight, Banknote, Gift, Landmark, Sprout, Terminal, type LucideIcon } from 'lucide-react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  useSurveysGetStateV1Query,
  useSurveysSubmitResponseV1Mutation,
  type SurveyOption,
} from '@safe-global/store/gateway/surveys'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import StepIndicator from '@/features/spaces/components/StepIndicator'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'

const ONBOARDING_STEP = 4
const TOTAL_STEPS = 4
const SURVEY_SLUG = 'onboarding'

// Backend-issued icon keys → frontend icon components.
// Unknown keys fall back to no icon.
const ICON_MAP: Record<string, LucideIcon> = {
  terminal: Terminal,
  gift: Gift,
  cash: Banknote,
  sprout: Sprout,
  swap: ArrowLeftRight,
  bank: Landmark,
}

const SurveyOnboarding = (): ReactElement | null => {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const spaceId = router.query.spaceId as string | undefined
  const isSurveyEnabled = useHasFeature(FEATURES.SPACE_ONBOARDING_SURVEY)

  const { data, isLoading, error } = useSurveysGetStateV1Query(
    { spaceId: spaceId ?? '', slug: SURVEY_SLUG },
    { skip: !spaceId || isSurveyEnabled !== true },
  )
  const [submit, { isLoading: isSubmitting, error: submitError }] = useSurveysSubmitResponseV1Mutation()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  useEffect(() => {
    if (isSurveyEnabled === false && spaceId) {
      router.replace({ pathname: AppRoutes.spaces.index, query: { spaceId } })
    }
  }, [isSurveyEnabled, router, spaceId])

  if (!spaceId || isSurveyEnabled !== true) return null

  const toggle = (key: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const onFinish = async (): Promise<void> => {
    if (selected.size === 0) return
    await submit({
      spaceId,
      slug: SURVEY_SLUG,
      submitSurveyResponseDto: { selections: Array.from(selected) },
    }).unwrap()
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <div className="flex w-full max-w-[1100px] flex-col items-center gap-8">
          <StepIndicator currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />

          <div className="flex flex-col items-center gap-2">
            <Typography variant="h2" align="center">
              {data?.survey.title ?? 'How will you use Safe?'}
            </Typography>
            {data?.survey.subtitle && (
              <Typography variant="paragraph" align="center" color="muted">
                {data.survey.subtitle}
              </Typography>
            )}
          </div>

          {isLoading && <Spinner />}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>Failed to load survey. Please refresh.</AlertDescription>
            </Alert>
          )}

          {data?.survey.surveyContent.options && (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.survey.surveyContent.options.map((opt: SurveyOption) => {
                const Icon = opt.icon ? ICON_MAP[opt.icon] : undefined
                const isChecked = selected.has(opt.key)
                return (
                  <Card
                    key={opt.key}
                    role="checkbox"
                    aria-checked={isChecked}
                    tabIndex={0}
                    onClick={() => toggle(opt.key)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        toggle(opt.key)
                      }
                    }}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isChecked && 'border-primary ring-1 ring-primary',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 p-4">
                      {Icon && (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <Icon className="size-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Typography variant="paragraph-medium">{opt.label}</Typography>
                        {opt.description && (
                          <Typography variant="paragraph-small" color="muted">
                            {opt.description}
                          </Typography>
                        )}
                      </div>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggle(opt.key)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${opt.label}`}
                        tabIndex={-1}
                      />
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>Failed to submit. Please try again.</AlertDescription>
            </Alert>
          )}

          <Button
            data-testid="survey-finish-button"
            type="button"
            size="lg"
            disabled={selected.size === 0 || isSubmitting}
            onClick={onFinish}
            className="w-full max-w-[400px]"
          >
            {isSubmitting ? <Spinner /> : 'Finish'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SurveyOnboarding

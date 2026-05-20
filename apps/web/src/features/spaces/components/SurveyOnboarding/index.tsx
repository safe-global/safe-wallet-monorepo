import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeftRight, Banknote, ChevronLeft, Gift, Landmark, Sprout, Terminal, type LucideIcon } from 'lucide-react'
import {
  useSurveysGetStateV1Query,
  useSurveysSubmitResponseV1Mutation,
  type SurveyOption,
} from '@safe-global/store/gateway/surveys'
import { AppRoutes } from '@/config/routes'
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

// RTK Query surfaces FetchBaseQueryError | SerializedError. The first shape carries
// the HTTP status; treat 404 as "no active survey" (admin turned it off via
// surveys.is_active = false) rather than a real failure.
const isNotFoundError = (err: unknown): boolean => {
  return typeof err === 'object' && err !== null && 'status' in err && (err as { status: unknown }).status === 404
}

const SurveyOnboarding = (): ReactElement | null => {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const spaceId = router.query.spaceId as string | undefined

  const { data, isLoading, error } = useSurveysGetStateV1Query(
    { spaceId: spaceId ?? '', slug: SURVEY_SLUG },
    { skip: !spaceId },
  )
  const [submit, { isLoading: isSubmitting, error: submitError }] = useSurveysSubmitResponseV1Mutation()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (router.isReady && !spaceId) {
      router.replace({ pathname: AppRoutes.welcome.createSpace })
    }
  }, [router, spaceId])

  // Treat a 404 from the state endpoint as "no active survey" (admin turned it
  // off via surveys.is_active = false) and exit silently to the Space dashboard.
  // Real errors (5xx, network) still surface in the alert below.
  useEffect(() => {
    if (isNotFoundError(error) && spaceId) {
      router.replace({ pathname: AppRoutes.spaces.index, query: { spaceId } })
    }
  }, [error, router, spaceId])

  // Note: don't early-return null on missing spaceId — the outer motion.div in
  // PageLayout only fades in if its child renders something. The redirect effect
  // above handles the missing-spaceId case while we render a static shell.

  const toggle = (key: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const goBack = (): void => {
    router.push({ pathname: AppRoutes.welcome.inviteMembers, query: { spaceId } })
  }

  // For now the survey only has one page; this is the page we render and submit.
  // When multi-page lands, replace this with a current-page selector + per-page
  // selections state.
  const page = data?.survey.surveyContent.pages[0]

  const onFinish = async (): Promise<void> => {
    if (!spaceId || !page || selected.size === 0) return
    await submit({
      spaceId,
      slug: SURVEY_SLUG,
      submitSurveyResponseDto: {
        selections: { [page.id]: Array.from(selected) },
      },
    }).unwrap()
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <div className="flex w-full max-w-[1100px] flex-col items-center gap-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goBack}
            aria-label="Go back"
            className="self-start rounded-md border border-card shadow-sm"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <StepIndicator currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />

          <div className="flex flex-col items-center gap-2">
            <Typography variant="h2" align="center">
              {page?.title ?? 'How will you use Safe?'}
            </Typography>
            {page?.subtitle && (
              <Typography variant="paragraph" align="center" color="muted">
                {page.subtitle}
              </Typography>
            )}
          </div>

          {isLoading && <Spinner />}

          {error && !isNotFoundError(error) && (
            <Alert variant="destructive">
              <AlertDescription>Failed to load survey. Please refresh.</AlertDescription>
            </Alert>
          )}

          {page?.options && (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page.options.map((opt: SurveyOption) => {
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
                      {/*
                        Visual-only indicator. The Card itself owns the click /
                        keyboard interaction and exposes role="checkbox" +
                        aria-checked, so the inner Checkbox is hidden from a11y
                        and ignores pointer events to avoid double-toggling.
                      */}
                      <Checkbox checked={isChecked} aria-hidden="true" tabIndex={-1} className="pointer-events-none" />
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
            disabled={!spaceId || selected.size === 0 || isSubmitting}
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

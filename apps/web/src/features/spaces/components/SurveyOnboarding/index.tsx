import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import {
  ArrowLeftRight,
  BarChart3,
  Check,
  ChevronLeft,
  FileCode,
  Send,
  Shield,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import {
  useSurveysGetStateV1Query,
  useSurveysSubmitResponseV1Mutation,
  type SurveyOption,
} from '@safe-global/store/gateway/surveys'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import {
  OnboardingLayout,
  StepCounter,
  SpaceSidePanel,
  deriveSidePanelAccountsFromSpace,
  useSafeNameLookup,
} from '@/features/spaces/components/OnboardingLayout'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import { cn } from '@/utils/cn'

const ONBOARDING_STEP = 4
const TOTAL_STEPS = 4
const SURVEY_SLUG = 'onboarding'

// Backend-issued icon keys → lucide icons, picked to match the prototype's
// Step 4 card design. Unknown keys fall back to no icon (the card still renders).
const ICON_MAP: Record<string, LucideIcon> = {
  terminal: FileCode, // Operate a protocol
  gift: Sparkles, // Distribute tokens
  cash: Send, // Run payments
  sprout: BarChart3, // Earn yield
  swap: ArrowLeftRight, // Trade and provide liquidity
  bank: Shield, // Hold assets
}

// RTK Query surfaces FetchBaseQueryError | SerializedError. The first shape carries
// the HTTP status; treat 404 as "no active survey" (admin turned it off via
// surveys.is_active = false) rather than a real failure.
const isNotFoundError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && 'status' in err && (err as { status: unknown }).status === 404

const SurveyOnboarding = (): ReactElement | null => {
  const router = useRouter()
  const spaceId = router.query.spaceId as string | undefined

  const { data, isLoading, error } = useSurveysGetStateV1Query(
    { spaceId: spaceId ?? '', slug: SURVEY_SLUG },
    { skip: !spaceId },
  )
  const { data: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !spaceId })
  const { allSafes: spaceSafes } = useSpaceSafes()
  const nameLookup = useSafeNameLookup()
  const sidePanelAccounts = useMemo(
    () => deriveSidePanelAccountsFromSpace(spaceSafes, nameLookup),
    [spaceSafes, nameLookup],
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
      submitSurveyResponseDto: { selections: { [page.id]: Array.from(selected) } },
    }).unwrap()
    router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
  }

  const main = (
    <div className="flex flex-col gap-6">
      <StepCounter currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />

      <div className="flex flex-col gap-2">
        <Typography variant="h2">{page?.title ?? 'How will you use Safe?'}</Typography>
        <Typography variant="paragraph" color="muted">
          {page?.subtitle ?? "Select all that apply. We'll tailor your setup."}
        </Typography>
      </div>

      {isLoading && <Spinner />}

      {error && !isNotFoundError(error) && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load survey. Please refresh.</AlertDescription>
        </Alert>
      )}

      {page?.options && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {page.options.map((opt: SurveyOption) => {
            const isPressed = selected.has(opt.key)
            const Icon = opt.icon ? ICON_MAP[opt.icon] : undefined
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isPressed}
                onClick={() => toggle(opt.key)}
                className={cn(
                  'flex cursor-pointer flex-col items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isPressed
                    ? 'border-[var(--color-static-text-brand)] bg-[var(--color-static-text-brand)]/5'
                    : 'border-border hover:border-ring hover:bg-muted',
                )}
              >
                <div className="flex w-full items-start justify-between">
                  {/* Icon in green-tinted rounded box */}
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-static-text-brand)]/15">
                    {Icon && <Icon className="size-5 text-foreground" strokeWidth={1.75} />}
                  </div>
                  {/* Checkbox — empty square (border only) or filled (foreground + check) */}
                  <div
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                      isPressed
                        ? 'border-[var(--color-static-text-brand)] bg-[var(--color-static-text-brand)]'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {isPressed && <Check className="size-3 text-white" strokeWidth={3} />}
                  </div>
                </div>
                {/* Label */}
                <span className="text-base font-semibold leading-snug text-foreground">{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>Failed to submit. Please try again.</AlertDescription>
        </Alert>
      )}
    </div>
  )

  const footer = (
    <div className="flex flex-col-reverse gap-3 xl:flex-row xl:items-center">
      <Button
        type="button"
        variant="ghost"
        onClick={goBack}
        disabled={isSubmitting}
        className="w-full h-12 rounded-lg bg-muted hover:bg-border xl:flex-1"
      >
        <ChevronLeft className="size-4 mr-1" />
        Back
      </Button>
      <Button
        data-testid="survey-finish-button"
        type="button"
        disabled={!spaceId || selected.size === 0 || isSubmitting}
        onClick={onFinish}
        className="w-full h-12 rounded-lg text-[15px] xl:flex-1"
      >
        {isSubmitting ? <Spinner /> : 'Create Space'}
      </Button>
    </div>
  )

  return (
    <OnboardingLayout
      main={main}
      footer={footer}
      sidePanel={<SpaceSidePanel name={space?.name ?? ''} highlight="accounts" accounts={sidePanelAccounts} />}
    />
  )
}

export default SurveyOnboarding

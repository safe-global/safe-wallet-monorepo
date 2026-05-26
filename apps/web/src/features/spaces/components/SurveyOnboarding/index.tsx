import { useEffect, useMemo, useState, type ReactElement } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { useRouter } from 'next/router'
import {
  ArrowLeftRight,
  BarChart3,
  Check,
  ChevronLeft,
  FileCode,
  HelpCircle,
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
import { flattenSafeItems } from '@/hooks/safes'
import { cn } from '@/utils/cn'

const ONBOARDING_STEP = 4
const TOTAL_STEPS = 4
const SURVEY_SLUG = 'onboarding'

// Backend-issued icon keys → lucide icons, picked to match the prototype's
// Step 4 card design. Unknown keys fall back to a generic placeholder so the
// card never renders iconless.
const ICON_MAP: Record<string, LucideIcon> = {
  terminal: FileCode, // Operate a protocol
  gift: Sparkles, // Distribute tokens
  cash: Send, // Run payments
  sprout: BarChart3, // Earn yield
  swap: ArrowLeftRight, // Trade and provide liquidity
  bank: Shield, // Hold assets
}
const FALLBACK_ICON: LucideIcon = HelpCircle

// RTK Query surfaces FetchBaseQueryError | SerializedError. The first carries
// the HTTP status; treat 404 as "no active survey" (admin turned it off via
// surveys.is_active = false) rather than a real failure.
const isNotFoundError = (err: FetchBaseQueryError | SerializedError | undefined): boolean => {
  return err != null && 'status' in err && err.status === 404
}

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
  const balanceSafes = useMemo(() => flattenSafeItems(spaceSafes), [spaceSafes])
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
    // Sort so the same set of options always produces the same array — keeps
    // server-side aggregation (group-by selections) deterministic.
    const selections = Array.from(selected).sort()
    try {
      await submit({
        spaceId,
        slug: SURVEY_SLUG,
        submitSurveyResponseDto: { selections: { [page.id]: selections } },
      }).unwrap()
      router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
    } catch {
      // The mutation hook exposes submitError, which renders the destructive
      // alert below. Swallow the rejection here so the click handler doesn't
      // surface an unhandled-promise warning.
    }
  }

  const main = (
    <div className="flex flex-col gap-6">
      <StepCounter currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />

      <div className="flex flex-col gap-2">
        <Typography variant="h2" id="survey-page-title">
          {page?.title ?? 'How will you use Safe?'}
        </Typography>
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
            const Icon = opt.icon ? (ICON_MAP[opt.icon] ?? FALLBACK_ICON) : undefined
            return (
              <button
                key={opt.key}
                type="button"
                aria-pressed={isPressed}
                onClick={() => toggle(opt.key)}
                className={cn(
                  'flex cursor-pointer flex-col items-start gap-3 rounded-2xl border bg-card p-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isPressed ? 'border-foreground' : 'border-border hover:border-ring hover:bg-muted',
                )}
              >
                <div className="flex w-full items-start justify-between">
                  {/* Icon in green-tinted rounded box — dark-green glyph (Tailwind green-600 / #16a34a in
                      light, Safe brand green in dark since #16a34a reads too muted on dark surfaces). */}
                  <div className="flex size-10 items-center justify-center rounded-md bg-[var(--color-static-text-brand)]/15">
                    {Icon && <Icon className="size-5 text-[var(--color-success-main)]" strokeWidth={1.75} />}
                  </div>
                  {/* Checkbox — empty square (border only) or filled black w/ white check when selected. */}
                  <div
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-sm border-2 transition-colors',
                      isPressed ? 'border-foreground bg-foreground' : 'border-muted-foreground/40',
                    )}
                  >
                    {isPressed && <Check className="size-3 text-background" strokeWidth={3} />}
                  </div>
                </div>
                {/* Label — paragraph-small-bold (14px/600) per the design system */}
                <Typography variant="paragraph-small-bold">{opt.label}</Typography>
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
        className="w-full h-12 rounded-lg text-base xl:flex-1"
      >
        {isSubmitting ? <Spinner /> : 'Create Space'}
      </Button>
    </div>
  )

  return (
    <OnboardingLayout
      main={main}
      footer={footer}
      sidePanel={
        <SpaceSidePanel
          name={space?.name ?? ''}
          highlight="accounts"
          accounts={sidePanelAccounts}
          balanceSafes={balanceSafes}
        />
      }
    />
  )
}

export default SurveyOnboarding

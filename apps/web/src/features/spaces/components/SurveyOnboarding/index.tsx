import { useEffect, useMemo, useState, type ReactElement } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { useRouter } from 'next/router'
import {
  ArrowLeftRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
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
  type SurveyOptionDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/surveys'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import {
  OnboardingLayout,
  StepCounter,
  SafeAppMockup,
  deriveSidePanelAccountsFromSpace,
  useSafeNameLookup,
} from '@/features/spaces/components/OnboardingLayout'
import { useSpaceSafes } from '@/features/spaces/hooks/useSpaceSafes'
import { flattenSafeItems } from '@/hooks/safes'
import SurveyOptionCard from './SurveyOptionCard'

const ONBOARDING_STEP = 4
const TOTAL_STEPS = 4
const SURVEY_SLUG = 'onboarding'

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
  const { data: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !spaceId })
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

  const page = data?.survey.surveyContent.pages[0]

  const onFinish = async (): Promise<void> => {
    if (!spaceId || !page || selected.size === 0) return
    // Sort so the same set of options always produces the same array — keeps
    // server-side aggregation (group-by selections) deterministic.
    const selections = Array.from(selected).sort()
    try {
      await submit({
        spaceId: spaceId ?? '',
        slug: SURVEY_SLUG,
        submitSurveyResponseDto: { selections: { [page.id]: selections } },
      }).unwrap()
      router.push({ pathname: AppRoutes.spaces.index, query: { spaceId } })
    } catch {
      // submitError feeds the alert below; swallow here to avoid unhandled-promise.
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
        <div className="grid auto-rows-fr grid-cols-2 gap-3 xl:grid-cols-3">
          {page.options.map((opt: SurveyOptionDto) => (
            <SurveyOptionCard
              key={opt.key}
              option={opt}
              Icon={opt.icon ? (ICON_MAP[opt.icon] ?? FALLBACK_ICON) : undefined}
              isPressed={selected.has(opt.key)}
              onToggle={toggle}
            />
          ))}
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
        {isSubmitting ? (
          <Spinner />
        ) : (
          <>
            Create Workspace
            <ChevronRight className="size-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  )

  return (
    <OnboardingLayout
      main={main}
      footer={footer}
      sidePanel={
        <SafeAppMockup
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

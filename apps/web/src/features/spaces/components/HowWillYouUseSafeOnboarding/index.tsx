import { useState, type ReactElement } from 'react'
import { ChevronLeft, Check, Briefcase, Sparkles, Send, BarChart3, ArrowLeftRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import StepIndicator from '@/features/spaces/components/StepIndicator'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import useUseCaseNavigation from './hooks/useUseCaseNavigation'

const ONBOARDING_STEP = 4
const TOTAL_STEPS = 4

const USE_CASES = [
  { id: 'operate-protocol', label: 'Operate a protocol', icon: Briefcase },
  { id: 'distribute-tokens', label: 'Distribute tokens', icon: Sparkles },
  { id: 'run-payments', label: 'Run payments', icon: Send },
  { id: 'earn-yield', label: 'Earn yield', icon: BarChart3 },
  { id: 'trade-liquidity', label: 'Trade and provide liquidity', icon: ArrowLeftRight },
  { id: 'hold-assets', label: 'Hold assets', icon: Shield },
] as const

const HowWillYouUseSafeOnboarding = (): ReactElement => {
  const isDarkMode = useDarkMode()
  const { goBack, redirectToNextStep } = useUseCaseNavigation()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleUseCase = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleFinish = () => {
    redirectToNextStep()
  }

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="flex w-[520px] flex-col items-center gap-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="self-start rounded-md border border-card shadow-sm"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <StepIndicator currentStep={ONBOARDING_STEP} totalSteps={TOTAL_STEPS} />

          <div className="flex flex-col items-center gap-2">
            <Typography variant="h2" align="center">
              How will you use Safe?
            </Typography>

            <Typography variant="paragraph" align="center" color="muted">
              Select all that apply. We&apos;ll tailor your setup.
            </Typography>
          </div>

          <div className="grid w-full grid-cols-3 gap-3">
            {USE_CASES.map(({ id, label, icon: Icon }) => {
              const isSelected = selected.has(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleUseCase(id)}
                  className={cn(
                    'relative flex flex-col gap-4 rounded-2xl p-4 text-left transition-all duration-150',
                    isSelected
                      ? 'border border-border bg-background'
                      : 'border border-transparent bg-background hover:border-border',
                  )}
                >
                  {/* Icon */}
                  <div className="flex size-10 items-center justify-center rounded-[12px] bg-[#f0fdf4] dark:bg-[#12FF80]/10">
                    <Icon className="size-5 text-[#16a34a] dark:text-[#12FF80]" />
                  </div>

                  {/* Checkbox — top right */}
                  <div
                    className={cn(
                      'absolute right-3 top-3 flex size-5 items-center justify-center rounded-md border transition-colors',
                      isSelected
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border',
                    )}
                  >
                    {isSelected && <Check className="size-3.5" />}
                  </div>

                  <span className="text-sm font-medium text-foreground">{label}</span>
                </button>
              )
            })}
          </div>

          <Button
            data-testid="how-will-you-use-safe-finish-button"
            type="button"
            size="lg"
            onClick={handleFinish}
            className="w-full"
          >
            Finish
          </Button>
        </div>
      </div>
    </div>
  )
}

export default HowWillYouUseSafeOnboarding

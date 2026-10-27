import type { InputHTMLAttributes, ReactNode } from 'react'
import { ArrowUpRight, Check, ChevronLeft, Loader2, PenLine } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Input } from '@safe-global/views/components/ui/input'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { ChainLogo, CopyAddressButton, SafeIdenticon, ShortAddressWithTooltip } from './shared/safeIdentity'

export type WizardStep = {
  readonly key: string
  readonly label: string
}

type WizardLayoutProps = {
  wizard: ReactNode
  form: ReactNode
  summary: ReactNode
}

export const WizardLayout = ({ wizard, form, summary }: WizardLayoutProps) => (
  <div className="max-w-[1160px]">
    <div className="grid grid-cols-1 items-start gap-x-6 gap-y-6 md:grid-cols-[176px_minmax(0,1fr)_320px] md:gap-x-5">
      <div className="hidden md:block md:pt-4">{wizard}</div>
      <div className="rounded-3xl bg-card p-6">{form}</div>
      <div className="hidden md:block">{summary}</div>
    </div>
  </div>
)

type VerticalWizardProps = {
  steps: readonly WizardStep[]
  currentIndex: number
}

export const VerticalWizard = ({ steps, currentIndex }: VerticalWizardProps) => (
  <div className="sticky top-6 flex flex-col">
    {steps.map((step, idx) => {
      const isActive = idx === currentIndex
      const isComplete = idx < currentIndex
      const filled = isActive || isComplete
      const isLast = idx === steps.length - 1

      return (
        <div key={step.key} className="relative flex gap-2.5 py-2">
          {!isLast && (
            <div
              className={cn(
                'absolute top-7 bottom-[-2px] left-[11px] z-0 w-0.5 transition-colors duration-200',
                isComplete ? 'bg-foreground' : 'bg-border',
              )}
            />
          )}
          <div
            className={cn(
              'z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums transition-all duration-200',
              filled
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            {isComplete ? <Check size={12} strokeWidth={3} /> : idx + 1}
          </div>
          <Typography
            variant="paragraph-small-bold"
            className={cn('pt-0.5 leading-5 transition-colors duration-200', !filled && 'text-muted-foreground')}
          >
            {step.label}
          </Typography>
        </div>
      )
    })}
  </div>
)

type FormHeaderProps = {
  currentIndex: number
  onBack: () => void
  onNext: () => void
  continueDisabled: boolean
  isReview: boolean
  isSubmitting: boolean
  firstStepBackLabel?: string
}

export const FormHeader = ({
  currentIndex,
  onBack,
  onNext,
  continueDisabled,
  isReview,
  isSubmitting,
  firstStepBackLabel = 'Policies',
}: FormHeaderProps) => {
  const isFirstStep = currentIndex === 0

  return (
    <div className="mb-6 flex flex-row items-center justify-between gap-4">
      <Button variant="ghost" disabled={isSubmitting} onClick={onBack} className="-ml-2">
        <ChevronLeft className="size-4" />
        {isFirstStep ? firstStepBackLabel : 'Back'}
      </Button>
      <Button variant="default" size="submit" disabled={continueDisabled || isSubmitting} onClick={onNext}>
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isReview ? (
          <>
            <PenLine className="size-4" />
            Review
          </>
        ) : (
          <>
            Continue
            <ArrowUpRight className="size-4" />
          </>
        )}
      </Button>
    </div>
  )
}

type PolicySummaryRowProps = {
  label: string
  value: ReactNode
  pending?: boolean
  isFirst?: boolean
}

export const PolicySummaryRow = ({ label, value, pending = false, isFirst = false }: PolicySummaryRowProps) => (
  <div
    className={cn(
      'flex items-start gap-3 px-1 py-2.5 transition-opacity duration-300',
      !isFirst && 'border-t border-border',
      pending && 'opacity-45',
    )}
  >
    <Typography
      variant="paragraph-mini-medium"
      className="w-[70px] shrink-0 pt-[3px] tracking-wider text-muted-foreground uppercase"
    >
      {label}
    </Typography>
    <div className="min-w-0 flex-1 text-sm font-semibold">{value}</div>
  </div>
)

export const SelectionCheck = ({ selected }: { selected: boolean }) => (
  <div
    className={cn(
      'flex size-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors duration-150',
      selected ? 'border-background bg-foreground text-background' : 'border-border bg-card',
    )}
  >
    {selected && <Check size={14} strokeWidth={3} />}
  </div>
)

/** Applied to a row that is the current selection. */
export const selectedRowClasses = 'bg-[var(--color-background-main)] border-background'

type OptionCardProps = {
  title: string
  description: ReactNode
  selected: boolean
  recommended?: boolean
  onClick: () => void
}

const RadioMark = ({ selected }: { selected: boolean }) => (
  <div
    className={cn(
      'flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] bg-card transition-colors duration-150',
      selected ? 'border-foreground' : 'border-border',
    )}
  >
    {selected && <div className="size-2 rounded-full bg-foreground" />}
  </div>
)

export const OptionCard = ({ title, description, selected, recommended, onClick }: OptionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3.5 py-3 text-left transition-colors duration-150',
      selected ? 'bg-accent' : 'bg-card hover:bg-[var(--color-background-main)]',
    )}
  >
    <RadioMark selected={selected} />
    <div className="min-w-0 flex-1">
      <div className="flex flex-row items-center gap-2">
        <Typography variant="paragraph-small-bold">{title}</Typography>
        {recommended && (
          <Typography variant="paragraph-mini-medium" className="tracking-wider text-success-strong uppercase">
            Recommended
          </Typography>
        )}
      </div>
      <div className="mt-px text-xs leading-snug text-muted-foreground">{description}</div>
    </div>
  </button>
)

type WizardFieldState = 'default' | 'valid' | 'error'

type WizardFieldProps = {
  icon: ReactNode
  iconBg?: 'accent' | 'neutral'
  value: string
  onChange: (v: string) => void
  placeholder?: string
  state?: WizardFieldState
  adornment?: ReactNode
  inputProps?: InputHTMLAttributes<HTMLInputElement>
  ariaLabel?: string
}

// Shared "icon + input + optional right-side pill" row used across the policy
// wizards. Centralises the field chrome so address / nickname / future inputs
// stay visually consistent on rest, hover, focus, valid and error states.
export const WizardField = ({
  icon,
  iconBg = 'neutral',
  value,
  onChange,
  placeholder,
  state = 'default',
  adornment,
  inputProps,
  ariaLabel,
}: WizardFieldProps) => (
  <div
    className={cn(
      'flex items-center gap-2.5 rounded-2xl border-[1.5px] bg-card px-3 py-2.5 transition-[border-color,box-shadow,background-color] duration-150',
      state === 'valid' && 'border-accent-success shadow-[0_0_0_3px_rgba(18,255,128,0.15)]',
      state === 'error' && 'border-destructive shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
      state === 'default' &&
        'border-border hover:border-border-main focus-within:border-foreground focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]',
    )}
  >
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg',
        iconBg === 'accent' ? 'bg-accent' : 'bg-[var(--color-background-main)]',
      )}
    >
      {icon}
    </div>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      aria-label={ariaLabel}
      // The chrome lives on the wrapper, so the input itself contributes nothing of its own.
      variant="surface"
      // eslint-disable-next-line no-restricted-syntax -- WizardField draws the border, background and focus ring; the input must add none of its own
      className="w-full border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
      {...inputProps}
    />
    {adornment}
  </div>
)

export type SafeRowItem = {
  chainId: string
  address: string
  name: string
}

export const safeKey = (s: { chainId: string; address: string }) => `${s.chainId}:${s.address.toLowerCase()}`

type ApplyToStepProps = {
  safes: SafeRowItem[]
  isLoading: boolean
  selectedKey: string
  onSelect: (item: SafeRowItem) => void
  title?: string
  emptyMessage?: string
}

const EmptyPanel = ({ children }: { children: ReactNode }) => (
  <div className="rounded-2xl bg-card p-8 text-center">
    <Typography className="text-muted-foreground">{children}</Typography>
  </div>
)

export const ApplyToStep = ({
  safes,
  isLoading,
  selectedKey,
  onSelect,
  title = 'Which Safe does this apply to?',
  emptyMessage = 'This space has no Safes yet.',
}: ApplyToStepProps) => (
  <>
    <Typography variant="h3" className="mb-5 tracking-tight">
      {title}
    </Typography>

    {isLoading && safes.length === 0 ? (
      <EmptyPanel>Loading Safes…</EmptyPanel>
    ) : safes.length === 0 ? (
      <EmptyPanel>{emptyMessage}</EmptyPanel>
    ) : (
      <div className="flex flex-col gap-2">
        {safes.map((safe) => {
          const k = safeKey(safe)
          const selected = k === selectedKey
          const name = safe.name || 'Safe'

          return (
            <button
              key={k}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(safe)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-4 rounded-2xl border-[1.5px] border-transparent px-4.5 py-3.5 text-left transition-colors duration-150',
                selected ? selectedRowClasses : 'bg-card hover:bg-[var(--color-background-main)]',
              )}
            >
              <SafeIdenticon address={safe.address} size={36} />
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <Typography variant="paragraph-small-bold" className="leading-tight">
                  {name}
                </Typography>
                <div className="flex min-w-0 flex-row items-center gap-1">
                  <ShortAddressWithTooltip address={safe.address} />
                  <CopyAddressButton address={safe.address} />
                </div>
              </div>
              <ChainLogo chainId={safe.chainId} size={20} />
              <SelectionCheck selected={selected} />
            </button>
          )
        })}
      </div>
    )}
  </>
)

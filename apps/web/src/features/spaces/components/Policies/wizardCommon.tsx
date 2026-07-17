import type { InputHTMLAttributes, ReactNode } from 'react'
import { Box, InputBase, Paper, Stack, Typography } from '@mui/material'
import { ArrowUpRight, Check, ChevronLeft, Loader2, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ChainLogo,
  CopyAddressButton,
  SafeIdenticon,
  ShortAddressWithTooltip,
} from '@/components/common/SpaceSafeBar/AccountsModal/shared'

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
  <Box sx={{ maxWidth: 1160 }}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '176px minmax(0, 1fr) 320px' },
        columnGap: { xs: 3, md: 2.5 },
        rowGap: 3,
        alignItems: 'flex-start',
      }}
    >
      <Box sx={{ display: { xs: 'none', md: 'block' }, pt: { md: 2 } }}>{wizard}</Box>
      <Paper elevation={0} sx={{ borderRadius: '24px', padding: 3 }}>
        {form}
      </Paper>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>{summary}</Box>
    </Box>
  </Box>
)

type VerticalWizardProps = {
  steps: readonly WizardStep[]
  currentIndex: number
}

export const VerticalWizard = ({ steps, currentIndex }: VerticalWizardProps) => (
  <Stack sx={{ position: 'sticky', top: 24 }}>
    {steps.map((step, idx) => {
      const isActive = idx === currentIndex
      const isComplete = idx < currentIndex
      const filled = isActive || isComplete
      const isLast = idx === steps.length - 1

      return (
        <Box key={step.key} sx={{ position: 'relative', display: 'flex', gap: 1.25, py: 1 }}>
          {!isLast && (
            <Box
              sx={{
                position: 'absolute',
                left: 11,
                top: 28,
                bottom: -2,
                width: 2,
                backgroundColor: isComplete ? 'text.primary' : 'border.light',
                transition: 'background-color 200ms ease',
                zIndex: 0,
              }}
            />
          )}
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
              backgroundColor: filled ? 'text.primary' : 'background.paper',
              border: '2px solid',
              borderColor: filled ? 'text.primary' : 'border.light',
              color: filled ? '#fff' : 'text.secondary',
              zIndex: 1,
              transition: 'all 200ms ease',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {isComplete ? <Check size={12} strokeWidth={3} /> : idx + 1}
          </Box>
          <Typography
            sx={{
              pt: '2px',
              fontSize: 13,
              fontWeight: 600,
              color: filled ? 'text.primary' : 'text.secondary',
              lineHeight: '20px',
              transition: 'color 200ms ease',
            }}
          >
            {step.label}
          </Typography>
        </Box>
      )
    })}
  </Stack>
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
    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
      <Button variant="ghost" disabled={isSubmitting} onClick={onBack} className="-ml-2">
        <ChevronLeft className="size-4" />
        {isFirstStep ? firstStepBackLabel : 'Back'}
      </Button>
      <Button variant="default" disabled={continueDisabled || isSubmitting} onClick={onNext} className="px-6">
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
    </Stack>
  )
}

type PolicySummaryRowProps = {
  label: string
  value: ReactNode
  pending?: boolean
  isFirst?: boolean
}

export const PolicySummaryRow = ({ label, value, pending = false, isFirst = false }: PolicySummaryRowProps) => (
  <Box
    sx={{
      py: 1.25,
      px: 0.5,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.5,
      borderTop: isFirst ? 'none' : '1px solid rgba(0, 0, 0, 0.06)',
      opacity: pending ? 0.45 : 1,
      transition: 'opacity 300ms ease',
    }}
  >
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        color: 'text.secondary',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        width: 70,
        flexShrink: 0,
        pt: '3px',
      }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }}>{value}</Box>
  </Box>
)

export const SelectionCheck = ({ selected }: { selected: boolean }) => (
  <Box
    sx={{
      width: 22,
      height: 22,
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1.5px solid',
      borderColor: selected ? '#fff' : 'border.light',
      backgroundColor: selected ? 'text.primary' : 'background.paper',
      transition: 'background-color 150ms, border-color 150ms',
      flexShrink: 0,
    }}
  >
    {selected && <Check size={14} strokeWidth={3} color="#fff" />}
  </Box>
)

export const selectedRowStyles = {
  backgroundColor: 'background.main',
  borderColor: '#fff',
} as const

type OptionCardProps = {
  title: string
  description: ReactNode
  selected: boolean
  recommended?: boolean
  onClick: () => void
}

const RadioMark = ({ selected }: { selected: boolean }) => (
  <Box
    sx={{
      width: 18,
      height: 18,
      borderRadius: '50%',
      border: '1.5px solid',
      borderColor: selected ? 'text.primary' : 'border.light',
      backgroundColor: 'background.paper',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'border-color 150ms ease',
    }}
  >
    {selected && <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'text.primary' }} />}
  </Box>
)

export const OptionCard = ({ title, description, selected, recommended, onClick }: OptionCardProps) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      cursor: 'pointer',
      padding: '12px 14px',
      borderRadius: '12px',
      border: '1px solid',
      borderColor: 'transparent',
      backgroundColor: selected ? 'secondary.background' : 'background.paper',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      transition: 'background-color 150ms ease, border-color 150ms ease',
      '&:hover': selected ? {} : { backgroundColor: 'background.main' },
    }}
  >
    <RadioMark selected={selected} />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{title}</Typography>
        {recommended && (
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: 'success.dark',
            }}
          >
            Recommended
          </Typography>
        )}
      </Stack>
      <Box sx={{ fontSize: 12.5, color: 'text.secondary', mt: '1px', lineHeight: 1.4 }}>{description}</Box>
    </Box>
  </Paper>
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
}: WizardFieldProps) => {
  const restBorder = state === 'valid' ? 'secondary.main' : state === 'error' ? 'error.main' : 'border.light'
  const restShadow =
    state === 'valid'
      ? '0 0 0 3px rgba(18, 255, 128, 0.15)'
      : state === 'error'
        ? '0 0 0 3px rgba(239, 68, 68, 0.15)'
        : 'none'

  return (
    <Paper
      elevation={0}
      sx={{
        padding: '10px 12px',
        borderRadius: '14px',
        border: '1.5px solid',
        borderColor: restBorder,
        boxShadow: restShadow,
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        transition: 'border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease',
        '&:hover': state === 'default' ? { borderColor: 'border.main' } : {},
        '&:focus-within':
          state === 'default' ? { borderColor: 'text.primary', boxShadow: '0 0 0 3px rgba(0, 0, 0, 0.06)' } : {},
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          backgroundColor: iconBg === 'accent' ? 'secondary.background' : 'background.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <InputBase
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputProps={{ spellCheck: false, ...(ariaLabel ? { 'aria-label': ariaLabel } : {}), ...inputProps }}
        sx={{ fontSize: 14, fontFamily: 'inherit' }}
      />
      {adornment}
    </Paper>
  )
}

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

export const ApplyToStep = ({
  safes,
  isLoading,
  selectedKey,
  onSelect,
  title = 'Which Safe does this apply to?',
  emptyMessage = 'This space has no Safes yet.',
}: ApplyToStepProps) => (
  <>
    <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', mb: 2.5 }}>
      {title}
    </Typography>

    {isLoading && safes.length === 0 ? (
      <Paper elevation={0} sx={{ padding: 4, textAlign: 'center', borderRadius: '14px' }}>
        <Typography sx={{ color: 'text.secondary' }}>Loading Safes…</Typography>
      </Paper>
    ) : safes.length === 0 ? (
      <Paper elevation={0} sx={{ padding: 4, textAlign: 'center', borderRadius: '14px' }}>
        <Typography sx={{ color: 'text.secondary' }}>{emptyMessage}</Typography>
      </Paper>
    ) : (
      <Stack gap={1}>
        {safes.map((safe) => {
          const k = safeKey(safe)
          const selected = k === selectedKey
          const name = safe.name || 'Safe'
          return (
            <Paper
              key={k}
              elevation={0}
              onClick={() => onSelect(safe)}
              sx={{
                cursor: 'pointer',
                padding: '14px 18px',
                borderRadius: '14px',
                border: '1.5px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'background-color 150ms ease, border-color 150ms ease',
                ...(selected && selectedRowStyles),
                '&:hover': selected ? {} : { backgroundColor: 'background.main' },
              }}
            >
              <SafeIdenticon address={safe.address} size={36} />
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{name}</Typography>
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ minWidth: 0 }}>
                  <ShortAddressWithTooltip address={safe.address} />
                  <CopyAddressButton address={safe.address} />
                </Stack>
              </Box>
              <ChainLogo chainId={safe.chainId} size={20} />
              <SelectionCheck selected={selected} />
            </Paper>
          )
        })}
      </Stack>
    )}
  </>
)

import { useMemo, type ReactElement, type ReactNode } from 'react'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { WorkspaceDraft } from '@/features/spaces/store'
import { OnboardingLayout, SafeAppMockup, StepCounter, type SafeAppMockupAccount } from '../OnboardingLayout'

/** One row per Safe address in the preview, named as the user named it in the draft. */
const toMockupAccounts = (draft: WorkspaceDraft): SafeAppMockupAccount[] => {
  const seen = new Set<string>()
  return draft.safes.flatMap(({ address }) => {
    const key = address.toLowerCase()
    if (seen.has(key)) return []
    seen.add(key)
    return [{ address, name: draft.safeNames[key] }]
  })
}

type WizardFrameProps = {
  draft: WorkspaceDraft
  stepNumber: number
  totalSteps: number
  title: string
  subtitle?: ReactNode
  highlight: 'switcher' | 'accounts'
  children: ReactNode
  footer: ReactNode
  onLogoClick?: () => void
}

const WizardFrame = ({
  draft,
  stepNumber,
  totalSteps,
  title,
  subtitle,
  highlight,
  children,
  footer,
  onLogoClick,
}: WizardFrameProps): ReactElement => {
  const accounts = useMemo(() => toMockupAccounts(draft), [draft])

  return (
    <OnboardingLayout
      main={
        <div className="flex flex-col gap-6">
          <StepCounter currentStep={stepNumber} totalSteps={totalSteps} />
          <div className="flex flex-col gap-2">
            <Typography variant="h2">{title}</Typography>
            {subtitle && (
              <Typography variant="paragraph" color="muted">
                {subtitle}
              </Typography>
            )}
          </div>
          {children}
        </div>
      }
      footer={footer}
      onLogoClick={onLogoClick}
      sidePanel={<SafeAppMockup name={draft.name} highlight={highlight} accounts={accounts} />}
    />
  )
}

export default WizardFrame

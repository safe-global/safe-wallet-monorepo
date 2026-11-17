import type { ComponentProps, ReactElement } from 'react'
import { Chip } from '@safe-global/views/components/ui/chip'
// eslint-disable-next-line no-restricted-imports -- deep import keeps this lazy chunk from pulling the whole safe-shield barrel
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { CheckStatus, PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { CHIP_VARIANT, STATUS_PRESENTATION, WARNING_RISK_LABEL } from '../statusPresentation'
import { SafenetPulse } from './SafenetBlocks'

type VerdictStatus = Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>

type SafenetStatusChipProps = Omit<ComponentProps<typeof Chip>, 'variant' | 'children'> & {
  publicStatus: VerdictStatus
  /** A running check shows the Safenet pulse instead of a severity icon. */
  isInFlight?: boolean
  /** A risk that cites only warning rules (`isWarningRisk`) shows as a warning, like Safe Shield. */
  isWarning?: boolean
}

/** The state chip of a Safenet check, shared by the details card and the queue and batch rows. */
export const SafenetStatusChip = ({
  publicStatus,
  isInFlight = false,
  isWarning = false,
  ...props
}: SafenetStatusChipProps): ReactElement => (
  <Chip variant={isWarning ? 'warning' : CHIP_VARIANT[publicStatus]} {...props}>
    {isInFlight ? (
      <SafenetPulse size={12} />
    ) : (
      <SeverityIcon
        severity={isWarning ? Severity.WARN : STATUS_PRESENTATION[publicStatus].severity}
        width={12}
        height={12}
      />
    )}
    {isWarning ? WARNING_RISK_LABEL : STATUS_PRESENTATION[publicStatus].label}
  </Chip>
)

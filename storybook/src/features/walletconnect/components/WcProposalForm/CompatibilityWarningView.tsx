import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'

import css from './styles.module.css'

export type CompatibilityWarningSeverityView = 'error' | 'warning' | 'info'

const SEVERITY_TO_VARIANT: Record<CompatibilityWarningSeverityView, 'info' | 'destructive' | 'warning'> = {
  error: 'destructive',
  warning: 'warning',
  info: 'info',
}

export type CompatibilityWarningViewProps = {
  severity: CompatibilityWarningSeverityView
  message: string
  isUnsupportedChain: boolean
  chainIds: Array<string>
  renderChainIndicator: (props: { chainId: string; className: string }) => ReactNode
}

export const CompatibilityWarningView = ({
  severity,
  message,
  isUnsupportedChain,
  chainIds,
  renderChainIndicator,
}: CompatibilityWarningViewProps) => {
  return (
    <>
      <Alert variant={SEVERITY_TO_VARIANT[severity]} outlined={severity !== 'warning'} className={css.alert}>
        <AlertSeverityIcon variant={SEVERITY_TO_VARIANT[severity]} />
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      {isUnsupportedChain && (
        <>
          <Typography variant="h4" className="mt-6 mb-2">
            Supported networks
          </Typography>

          <div className={`flex flex-row ${css.chainContainer}`}>
            {chainIds.map((chainId) => renderChainIndicator({ chainId, className: css.chain }))}
          </div>
        </>
      )}
    </>
  )
}

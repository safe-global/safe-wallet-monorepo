import type { ReactElement } from 'react'
import { Info } from 'lucide-react'
import { Badge, type badgeVariants } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { VariantProps } from 'class-variance-authority'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

type WarningSeverity = 'info' | 'success' | 'warning' | 'error'

const severityBadgeVariant: Record<WarningSeverity, NonNullable<VariantProps<typeof badgeVariants>['variant']>> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'destructive',
}

export type WarningViewProps = {
  datatestid?: string
  title: string | ReactElement
  text: string
  severity: WarningSeverity
}

export const WarningView = ({ datatestid, title, text, severity }: WarningViewProps): ReactElement => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            data-testid={datatestid}
            variant={severityBadgeVariant[severity]}
            size="lg"
            className="mb-2 gap-1.5 cursor-default"
          >
            <Info className="size-3.5 shrink-0" />
            {text}
          </Badge>
        }
      />
      <TooltipContent side="top" align="start">
        {title}
      </TooltipContent>
    </Tooltip>
  )
}

export const DelegateCallWarningView = ({ trustedDelegateCall }: { trustedDelegateCall: boolean }): ReactElement => (
  <WarningView
    datatestid="delegate-call-warning"
    title={
      <>
        This transaction calls a smart contract that will be able to modify your Safe account.
        {!trustedDelegateCall && (
          <>
            <br />
            <ExternalLink href={HelpCenterArticle.UNEXPECTED_DELEGATE_CALL}>Learn more</ExternalLink>
          </>
        )}
      </>
    }
    severity={trustedDelegateCall ? 'success' : 'warning'}
    text={trustedDelegateCall ? 'Delegate call' : 'Unexpected delegate call'}
  />
)

export const UntrustedFallbackHandlerWarningView = ({ title }: { title: ReactElement }): ReactElement => (
  <WarningView
    datatestid="untrusted-fallback-handler-warning"
    title={title}
    severity="warning"
    text="Unofficial fallback handler"
  />
)

export const ThresholdWarningView = (): ReactElement => (
  <WarningView
    datatestid="threshold-warning"
    title="This transaction potentially alters the number of confirmations required to execute a transaction. Please verify before signing."
    severity="warning"
    text="Confirmation policy change"
  />
)

export const UnsignedWarningView = (): ReactElement => (
  <WarningView
    title="This transaction is unsigned and could have been created by anyone. To avoid phishing, only sign it if you trust the source of the link."
    severity="error"
    text="Untrusted transaction"
  />
)

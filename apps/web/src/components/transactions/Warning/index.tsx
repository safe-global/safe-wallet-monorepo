import type { ReactElement } from 'react'
import { Info } from 'lucide-react'
import { Badge, type badgeVariants } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { VariantProps } from 'class-variance-authority'
import ExternalLink from '@/components/common/ExternalLink'
import { UntrustedFallbackHandlerTxText } from '@/components/tx/confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import { cn } from '@/utils/cn'

type WarningSeverity = 'info' | 'success' | 'warning' | 'error'

const severityBadgeVariant: Record<WarningSeverity, NonNullable<VariantProps<typeof badgeVariants>['variant']>> = {
  info: 'secondary',
  success: 'success',
  warning: 'warning',
  error: 'destructive',
}

const Warning = ({
  datatestid,
  title,
  text,
  severity,
}: {
  datatestid?: string
  title: string | ReactElement
  text: string
  severity: WarningSeverity
}): ReactElement => {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            data-testid={datatestid}
            variant={severityBadgeVariant[severity]}
            className={cn('mb-2 h-6 cursor-default gap-1.5 px-2.5 py-0 text-xs font-medium')}
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

export const DelegateCallWarning = ({
  txData,
  showWarning,
}: {
  txData: TransactionDetails['txData']
  showWarning: boolean
}): ReactElement => {
  const isDelegateCall = txData?.operation === Operation.DELEGATE
  const trustedDelegateCall = isDelegateCall && !!txData?.trustedDelegateCallTarget

  if (!isDelegateCall || (!trustedDelegateCall && !showWarning)) return <></>

  return (
    <Warning
      datatestid="delegate-call-warning"
      title={
        <>
          This transaction calls a smart contract that will be able to modify your Safe Account.
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
}

export const UntrustedFallbackHandlerWarning = ({
  isTxExecuted = false,
}: {
  isTxExecuted?: boolean
}): ReactElement | null => (
  <Warning
    datatestid="untrusted-fallback-handler-warning"
    title={<UntrustedFallbackHandlerTxText isTxExecuted={isTxExecuted} />}
    severity="warning"
    text="Unofficial fallback handler"
  />
)

export const ThresholdWarning = (): ReactElement => (
  <Warning
    datatestid="threshold-warning"
    title="This transaction potentially alters the number of confirmations required to execute a transaction. Please verify before signing."
    severity="warning"
    text="Confirmation policy change"
  />
)

export const UnsignedWarning = (): ReactElement => (
  <Warning
    title="This transaction is unsigned and could have been created by anyone. To avoid phishing, only sign it if you trust the source of the link."
    severity="error"
    text="Untrusted transaction"
  />
)

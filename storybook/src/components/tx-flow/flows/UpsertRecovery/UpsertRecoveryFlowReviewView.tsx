import type { ReactElement, ReactNode } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import { TxDataRow } from '@/components/transactions/TxDetails/Summary/TxDataRow'
import InfoIcon from '@/public/images/notifications/info.svg'
import { TOOLTIP_TITLES } from '@views/components/tx-flow/common/constants'
import { getDetailedPeriod } from '@safe-global/utils/utils/date'
import { ErrorMessageView } from '@views/components/tx/ErrorMessage/ErrorMessageView'
import { Typography } from '@/components/ui/typography'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function UpsertRecoveryFlowReviewNoDataView(): ReactElement {
  return <ErrorMessageView>No data provided</ErrorMessageView>
}

export type UpsertRecoveryFlowReviewViewProps = {
  isEdit: boolean
  recoverer: string
  delaySeconds: number
  expirySeconds: number
  children?: ReactNode
}

export function UpsertRecoveryFlowReviewView({
  isEdit,
  recoverer,
  delaySeconds,
  expirySeconds,
  children,
}: UpsertRecoveryFlowReviewViewProps): ReactElement {
  return (
    <>
      <Typography>
        This transaction will {isEdit ? 'update' : 'enable'} the Account recovery feature once executed.
      </Typography>

      <TxDataRow title="Trusted Recoverer">
        <EthHashInfo address={recoverer} showName={false} hasExplorer showCopyButton avatarSize={24} />
      </TxDataRow>

      <TxDataRow
        title={
          <>
            Review window
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
              </TooltipTrigger>
              <TooltipContent>{TOOLTIP_TITLES.REVIEW_WINDOW}</TooltipContent>
            </Tooltip>
          </>
        }
      >
        {getDetailedPeriod(delaySeconds)}
      </TxDataRow>

      {expirySeconds !== 0 && (
        <TxDataRow
          title={
            <>
              Proposal expiry
              <Tooltip>
                <TooltipTrigger render={<span />}>
                  <InfoIcon className="ml-1 inline size-4 align-middle text-[var(--color-border-main)]" />
                </TooltipTrigger>
                <TooltipContent>{TOOLTIP_TITLES.PROPOSAL_EXPIRY}</TooltipContent>
              </Tooltip>
            </>
          }
        >
          {getDetailedPeriod(expirySeconds)}
        </TxDataRow>
      )}

      {children}
    </>
  )
}

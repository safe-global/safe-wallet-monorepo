import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import InfoIcon from '@/public/images/notifications/info.svg'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import EthHashInfo from '@/components/common/EthHashInfo'

export default function TxNote({ txDetails }: { txDetails: TransactionDetails | undefined }) {
  const note = txDetails?.note
  if (!note) return null

  const creator =
    isMultisigDetailedExecutionInfo(txDetails?.detailedExecutionInfo) && txDetails?.detailedExecutionInfo.proposer

  return (
    <div>
      <Typography variant="h4" className="flex items-center">
        Note
        <Tooltip>
          <TooltipTrigger
            data-testid="tx-note-tooltip"
            render={<span className="inline-flex h-[1em] text-muted-foreground" />}
          >
            <InfoIcon height="100%" />
          </TooltipTrigger>
          <TooltipContent>
            <div data-testid="note-creator" className="flex flex-row gap-2">
              <span>By </span>
              {creator ? (
                <EthHashInfo avatarSize={20} address={creator.value} showName onlyName />
              ) : (
                <span>transaction creator</span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </Typography>

      <Typography
        data-testid="tx-note"
        variant="paragraph"
        className="mt-2 rounded bg-[var(--color-background-main)] p-4"
      >
        {note}
      </Typography>
    </div>
  )
}

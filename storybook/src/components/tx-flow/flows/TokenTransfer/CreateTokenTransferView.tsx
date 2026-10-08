import { type ReactElement, type ReactNode, type FormEventHandler } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

import { Alert, AlertTitle, AlertDescription, AlertAction, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { X as CloseIcon } from 'lucide-react'
import TokenIcon from '@/components/common/TokenIcon'
import AddIcon from '@/public/images/common/add.svg'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'

export const AutocompleteItem = (item: { tokenInfo: Balance['tokenInfo']; balance: string }): ReactElement => (
  <div className="flex items-center gap-2">
    <TokenIcon logoUri={item.tokenInfo.logoUri} key={item.tokenInfo.address} tokenSymbol={item.tokenInfo.symbol} />

    <div className="flex-1" data-testid="token-item">
      <Typography variant="paragraph-small" className="block whitespace-nowrap">
        {item.tokenInfo.name}
      </Typography>

      <Typography variant="paragraph-mini" className="block">
        {formatVisualAmount(item.balance, item.tokenInfo.decimals)} {item.tokenInfo.symbol}
      </Typography>
    </div>
  </div>
)

export type CreateTokenTransferViewProps = {
  onSubmit: FormEventHandler<HTMLFormElement>
  recipientRows: ReactNode
  canBatch: boolean
  onAddRecipient: () => void
  canAddMoreRecipients: boolean
  recipientCount: number
  maxRecipients: number
  showNoFeeCampaign: boolean
  noFeeCampaignCard: ReactNode
  hasInsufficientFunds: boolean | undefined
  maxRecipientsInfo: boolean
  onCloseMaxRecipientsInfo: () => void
  hasCsvAirdropApp: boolean
  onOpenCsvAirdrop: () => void
  csvAirdropModal: ReactNode
  isValid: boolean
}

export const CreateTokenTransferView = ({
  onSubmit,
  recipientRows,
  canBatch,
  onAddRecipient,
  canAddMoreRecipients,
  recipientCount,
  maxRecipients,
  showNoFeeCampaign,
  noFeeCampaignCard,
  hasInsufficientFunds,
  maxRecipientsInfo,
  onCloseMaxRecipientsInfo,
  hasCsvAirdropApp,
  onOpenCsvAirdrop,
  csvAirdropModal,
  isValid,
}: CreateTokenTransferViewProps): ReactElement => {
  const CsvAirdropLink = () => (
    <Link render={<button type="button" />} className="cursor-pointer" onClick={onOpenCsvAirdrop}>
      CSV Airdrop
    </Link>
  )

  return (
    <TxCard>
      <form onSubmit={onSubmit} className={commonCss.form}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-16">{recipientRows}</div>

          {canBatch && (
            <>
              <div className="flex flex-row items-center justify-between">
                <Track {...MODALS_EVENTS.ADD_RECIPIENT}>
                  <Button
                    data-testid="add-recipient-btn"
                    variant="ghost"
                    size="lg"
                    onClick={onAddRecipient}
                    disabled={!canAddMoreRecipients}
                  >
                    <AddIcon className="size-4" />
                    Add recipient
                  </Button>
                </Track>
                <Typography
                  data-testid="recipients-count"
                  variant="paragraph-small"
                  className={
                    canAddMoreRecipients ? 'text-[var(--color-primary-main)]' : 'text-[var(--color-error-main)]'
                  }
                >{`${recipientCount}/${maxRecipients}`}</Typography>
              </div>

              {showNoFeeCampaign && noFeeCampaignCard}

              {hasInsufficientFunds && (
                <Alert data-testid="insufficient-balance-error" variant="destructive" outlined={false}>
                  <AlertSeverityIcon variant="destructive" />
                  <AlertTitle>Insufficient balance</AlertTitle>
                  <AlertDescription>
                    The total amount assigned to all recipients exceeds your available balance. Please adjust the
                    amounts you want to send.
                  </AlertDescription>
                </Alert>
              )}

              {canAddMoreRecipients && maxRecipientsInfo && hasCsvAirdropApp && (
                <Alert data-testid="csv-airdrop-hint" variant="info">
                  <AlertSeverityIcon variant="info" />
                  <AlertDescription>
                    If you want to add more than {maxRecipients} recipients, use <CsvAirdropLink />
                  </AlertDescription>
                  <AlertAction>
                    <Button aria-label="close" variant="ghost" size="icon-sm" onClick={onCloseMaxRecipientsInfo}>
                      <CloseIcon />
                    </Button>
                  </AlertAction>
                </Alert>
              )}

              {!canAddMoreRecipients && (
                <Alert data-testid="max-recipients-reached" variant="warning" outlined={false}>
                  <AlertSeverityIcon variant="warning" />
                  <AlertDescription>
                    No more recipients can be added.
                    {hasCsvAirdropApp && (
                      <>
                        <br />
                        Please use <CsvAirdropLink />
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {csvAirdropModal}
            </>
          )}

          <div>
            <Separator bleed="6" />

            <TxCardActions>
              <Button type="submit" size="submit" disabled={!isValid}>
                Next
              </Button>
            </TxCardActions>
          </div>
        </div>
      </form>
    </TxCard>
  )
}

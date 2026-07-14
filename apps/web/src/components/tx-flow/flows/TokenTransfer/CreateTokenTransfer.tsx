import { useVisibleTokens } from '@/components/tx-flow/flows/TokenTransfer/utils'
import { type ReactElement, useContext, useEffect, useMemo, useState } from 'react'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'

import { Alert, AlertTitle, AlertDescription, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { X as CloseIcon } from 'lucide-react'
import TokenIcon from '@/components/common/TokenIcon'
import AddIcon from '@/public/images/common/add.svg'
import {
  type MultiTokenTransferParams,
  TokenTransferFields,
  MultiTokenTransferFields,
  TokenTransferType,
  MultiTransfersFields,
} from './types'
import TxCard from '../../common/TxCard'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useHasPermission } from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import RecipientRow from './RecipientRow'
import { SafeAppsName } from '@/config/constants'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import CSVAirdropAppModal from './CSVAirdropAppModal'
import { InsufficientFundsValidationError } from '@/components/common/TokenAmountInput'
import { useHasFeature } from '@/hooks/useChains'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TxFlowContext, type TxFlowContextType } from '../../TxFlowProvider'
import {
  NoFeeCampaignFeature,
  useNoFeeCampaignEligibility,
  useIsNoFeeCampaignEnabled,
} from '@/features/no-fee-campaign'
import { useLoadFeature } from '@/features/__core__'
import { useSafeShieldForRecipients } from '@/features/safe-shield/SafeShieldContext'
import uniq from 'lodash/uniq'

export const AutocompleteItem = (item: { tokenInfo: Balance['tokenInfo']; balance: string }): ReactElement => (
  <div className="flex items-center gap-2">
    <TokenIcon logoUri={item.tokenInfo.logoUri} key={item.tokenInfo.address} tokenSymbol={item.tokenInfo.symbol} />

    <div className="flex-1" data-testid="token-item">
      <Typography variant="paragraph-small" className="block whitespace-normal">
        {item.tokenInfo.name}
      </Typography>

      <Typography variant="paragraph-mini" className="block">
        {formatVisualAmount(item.balance, item.tokenInfo.decimals)} {item.tokenInfo.symbol}
      </Typography>
    </div>
  </div>
)

const MAX_RECIPIENTS = 5

export type CreateTokenTransferProps = {
  txNonce?: number
}

const CreateTokenTransfer = ({ txNonce }: CreateTokenTransferProps): ReactElement => {
  const { NoFeeCampaignTransactionCard } = useLoadFeature(NoFeeCampaignFeature)
  const disableSpendingLimit = txNonce !== undefined
  const [csvAirdropModalOpen, setCsvAirdropModalOpen] = useState<boolean>(false)
  const [maxRecipientsInfo, setMaxRecipientsInfo] = useState<boolean>(false)
  const canCreateStandardTx = useHasPermission(Permission.CreateTransaction)
  const canCreateSpendingLimitTx = useHasPermission(Permission.CreateSpendingLimitTransaction)
  const balancesItems = useVisibleTokens()
  const { setNonce } = useContext(SafeTxContext)
  const [safeApps] = useRemoteSafeApps({ name: SafeAppsName.CSV })
  const isMassPayoutsEnabled = useHasFeature(FEATURES.MASS_PAYOUTS)
  const { onNext, data } = useContext(TxFlowContext) as TxFlowContextType<MultiTokenTransferParams>
  const { isEligible } = useNoFeeCampaignEligibility()
  const isNoFeeCampaignEnabled = useIsNoFeeCampaignEnabled()

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [setNonce, txNonce])

  const formMethods = useForm<MultiTokenTransferParams>({
    defaultValues: {
      ...data,
      [MultiTransfersFields.type]: disableSpendingLimit
        ? TokenTransferType.multiSig
        : canCreateSpendingLimitTx && !canCreateStandardTx
          ? TokenTransferType.spendingLimit
          : data?.type,
      recipients:
        data?.recipients.map(({ tokenAddress, ...rest }) => ({
          ...rest,
          [TokenTransferFields.tokenAddress]:
            canCreateSpendingLimitTx && !canCreateStandardTx
              ? tokenAddress || balancesItems[0]?.tokenInfo.address
              : tokenAddress,
        })) || [],
    },
    mode: 'onChange',
    delayError: 500,
  })

  const { handleSubmit, control, watch, formState } = formMethods

  const hasInsufficientFunds = useMemo(
    () =>
      !!formState.errors.recipients &&
      formState.errors.recipients.some?.((item) => item?.amount?.message === InsufficientFundsValidationError),
    [formState],
  )

  const type = watch(MultiTransfersFields.type)

  const {
    fields: recipientFields,
    append,
    remove,
  } = useFieldArray({ control, name: MultiTokenTransferFields.recipients })

  const canAddMoreRecipients = useMemo(() => recipientFields.length < MAX_RECIPIENTS, [recipientFields])

  const addRecipient = (): void => {
    if (!canAddMoreRecipients) {
      setCsvAirdropModalOpen(true)
      return
    }

    if (recipientFields.length === 1) {
      setMaxRecipientsInfo(true)
    }

    append({
      recipient: '',
      tokenAddress: ZERO_ADDRESS,
      amount: '',
    })
  }

  const removeRecipient = (index: number): void => {
    if (recipientFields.length > 1) {
      remove(index)
    }
  }

  const csvAirdropAppUrl = safeApps?.[0]?.url

  const CsvAirdropLink = () => (
    <Link render={<button type="button" />} className="cursor-pointer" onClick={() => setCsvAirdropModalOpen(true)}>
      CSV Airdrop
    </Link>
  )

  const canBatch = isMassPayoutsEnabled && type === TokenTransferType.multiSig

  const recipientsWatched = useWatch({ control, name: MultiTokenTransferFields.recipients })
  const recipientAddresses = useMemo(
    () => uniq(recipientsWatched.map((recipient) => recipient.recipient).filter(Boolean)),
    [recipientsWatched],
  )

  useSafeShieldForRecipients(recipientAddresses)

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onNext)} className={commonCss.form}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-16">
              {recipientFields.map((field, index) => (
                <RecipientRow
                  key={field.id}
                  removable={recipientFields.length > 1}
                  fieldArray={{ name: MultiTokenTransferFields.recipients, index }}
                  remove={removeRecipient}
                  disableSpendingLimit={disableSpendingLimit || recipientFields.length > 1}
                />
              ))}
            </div>

            {canBatch && (
              <>
                <div className="mb-8 flex flex-row items-center justify-between">
                  <Track {...MODALS_EVENTS.ADD_RECIPIENT}>
                    <Button
                      data-testid="add-recipient-btn"
                      variant="ghost"
                      onClick={addRecipient}
                      disabled={!canAddMoreRecipients}
                      size="lg"
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
                  >{`${recipientFields.length}/${MAX_RECIPIENTS}`}</Typography>
                </div>

                {isEligible && isNoFeeCampaignEnabled && <NoFeeCampaignTransactionCard />}

                {hasInsufficientFunds && (
                  <Alert data-testid="insufficient-balance-error" variant="destructive">
                    <AlertTitle>Insufficient balance</AlertTitle>
                    <AlertDescription>
                      The total amount assigned to all recipients exceeds your available balance. Please adjust the
                      amounts you want to send.
                    </AlertDescription>
                  </Alert>
                )}

                {canAddMoreRecipients && maxRecipientsInfo && !!csvAirdropAppUrl && (
                  <Alert variant="default">
                    <AlertDescription>
                      If you want to add more than {MAX_RECIPIENTS} recipients, use <CsvAirdropLink />
                    </AlertDescription>
                    <AlertAction>
                      <Button
                        aria-label="close"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setMaxRecipientsInfo(false)}
                      >
                        <CloseIcon />
                      </Button>
                    </AlertAction>
                  </Alert>
                )}

                {!canAddMoreRecipients && (
                  <Alert data-testid="max-recipients-reached" variant="warning">
                    <AlertDescription>
                      No more recipients can be added.
                      {!!csvAirdropAppUrl && (
                        <>
                          <br />
                          Please use <CsvAirdropLink />
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {csvAirdropModalOpen && (
                  <CSVAirdropAppModal onClose={() => setCsvAirdropModalOpen(false)} appUrl={csvAirdropAppUrl} />
                )}
              </>
            )}

            <div>
              <Separator className={commonCss.nestedDivider} />

              <div className="flex items-center gap-2 p-2">
                <Button type="submit" disabled={!formState.isValid}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default CreateTokenTransfer

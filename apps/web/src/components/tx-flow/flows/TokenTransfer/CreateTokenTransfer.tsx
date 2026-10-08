import { useVisibleTokens } from '@/components/tx-flow/flows/TokenTransfer/utils'
import { type ReactElement, useContext, useEffect, useMemo, useState } from 'react'
import { FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'

import {
  type MultiTokenTransferParams,
  TokenTransferFields,
  MultiTokenTransferFields,
  TokenTransferType,
  MultiTransfersFields,
} from '@views/components/tx-flow/flows/TokenTransfer/types'
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
import {
  AutocompleteItem,
  CreateTokenTransferView,
} from '@views/components/tx-flow/flows/TokenTransfer/CreateTokenTransferView'

export { AutocompleteItem }

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

  const canBatch = isMassPayoutsEnabled && type === TokenTransferType.multiSig

  const recipientsWatched = useWatch({ control, name: MultiTokenTransferFields.recipients })
  const recipientAddresses = useMemo(
    () => uniq(recipientsWatched.map((recipient) => recipient.recipient).filter(Boolean)),
    [recipientsWatched],
  )

  useSafeShieldForRecipients(recipientAddresses)

  return (
    <FormProvider {...formMethods}>
      <CreateTokenTransferView
        onSubmit={handleSubmit(onNext)}
        recipientRows={recipientFields.map((field, index) => (
          <RecipientRow
            key={field.id}
            removable={recipientFields.length > 1}
            fieldArray={{ name: MultiTokenTransferFields.recipients, index }}
            remove={removeRecipient}
            disableSpendingLimit={disableSpendingLimit || recipientFields.length > 1}
          />
        ))}
        canBatch={!!canBatch}
        onAddRecipient={addRecipient}
        canAddMoreRecipients={canAddMoreRecipients}
        recipientCount={recipientFields.length}
        maxRecipients={MAX_RECIPIENTS}
        showNoFeeCampaign={!!(isEligible && isNoFeeCampaignEnabled)}
        noFeeCampaignCard={<NoFeeCampaignTransactionCard />}
        hasInsufficientFunds={hasInsufficientFunds}
        maxRecipientsInfo={maxRecipientsInfo}
        onCloseMaxRecipientsInfo={() => setMaxRecipientsInfo(false)}
        hasCsvAirdropApp={!!csvAirdropAppUrl}
        onOpenCsvAirdrop={() => setCsvAirdropModalOpen(true)}
        csvAirdropModal={
          csvAirdropModalOpen && (
            <CSVAirdropAppModal onClose={() => setCsvAirdropModalOpen(false)} appUrl={csvAirdropAppUrl} />
          )
        }
        isValid={formState.isValid}
      />
    </FormProvider>
  )
}

export default CreateTokenTransfer

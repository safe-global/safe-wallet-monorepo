import { memo, type ReactElement, useContext, useMemo, useState, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { _formatNumber } from '@/components/common/NumberField'
import { useQueuedTxByNonce } from '@/hooks/useTxQueue'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { getLatestTransactions } from '@/utils/tx-list'
import { getTransactionType } from '@/hooks/useTransactionType'
import usePreviousNonces from '@/hooks/usePreviousNonces'

import {
  NonceFormOptionView,
  TxNonceFormView,
  TxNonceReadOnlyView,
  TxNonceView,
} from '@views/components/tx-flow/common/TxNonce/TxNonceView'

const NonceFormOption = memo(function NonceFormOption({ nonce }: { nonce: string }): ReactElement {
  const addressBook = useAddressBook()
  const transactions = useQueuedTxByNonce(Number(nonce))

  const tx = useMemo(() => {
    const latestTransactions = getLatestTransactions(transactions)

    if (latestTransactions.length === 0) {
      return
    }

    const [{ transaction }] = latestTransactions
    const note = transaction.note?.trim()
    return {
      note,
      humanDescription: transaction.txInfo.humanDescription,
      typeText: getTransactionType(transaction, addressBook).text,
    }
  }, [addressBook, transactions])

  return <NonceFormOptionView nonce={nonce} tx={tx} />
})

enum TxNonceFormFieldNames {
  NONCE = 'nonce',
}

enum ErrorMessages {
  NONCE_MUST_BE_NUMBER = 'Nonce must be a number',
  NONCE_TOO_LOW = "Nonce can't be lower than %%nonce%%",
  NONCE_TOO_HIGH = 'Nonce is too high',
  NONCE_TOO_FAR = 'Nonce is much higher than the current nonce',
  NONCE_GT_RECOMMENDED = 'Nonce is higher than the recommended nonce',
  NONCE_MUST_BE_INTEGER = "Nonce can't contain decimals",
}

const MAX_NONCE_DIFFERENCE = 100

const TxNonceForm = ({ nonce, recommendedNonce }: { nonce: string; recommendedNonce: string }) => {
  const { safeTx, setNonce } = useContext(SafeTxContext)
  const { isRejection } = useContext(TxFlowContext)
  const previousNonces = usePreviousNonces().map((nonce) => nonce.toString())
  const { safe } = useSafeInfo()
  const [warning, setWarning] = useState<string>('')

  const showRecommendedNonceButton = recommendedNonce !== nonce
  const isEditable = !safeTx || safeTx?.signatures.size === 0
  const readOnly = !isEditable || isRejection

  const formMethods = useForm({
    defaultValues: {
      [TxNonceFormFieldNames.NONCE]: nonce,
    },
    mode: 'all',
    values: {
      [TxNonceFormFieldNames.NONCE]: nonce,
    },
  })

  const resetNonce = () => {
    // shouldValidate re-runs the `validate` rule, which propagates the value to SafeTxContext
    formMethods.setValue(TxNonceFormFieldNames.NONCE, recommendedNonce, { shouldValidate: true })
  }

  useEffect(() => {
    let message = ''
    // Warnings
    if (Number(nonce) > Number(recommendedNonce)) {
      message = ErrorMessages.NONCE_GT_RECOMMENDED
    }

    if (Number(nonce) >= safe.nonce + MAX_NONCE_DIFFERENCE) {
      message = ErrorMessages.NONCE_TOO_FAR
    }

    setWarning(message)
  }, [nonce, recommendedNonce, safe.nonce])

  return (
    <Controller
      name={TxNonceFormFieldNames.NONCE}
      control={formMethods.control}
      rules={{
        required: 'Nonce is required',
        // Validation must be async to allow resetting invalid values onBlur
        validate: async (value) => {
          // nonce is always valid so no need to validate if the input is the same
          if (value === nonce) return

          const newNonce = Number(value)

          if (isNaN(newNonce)) {
            return ErrorMessages.NONCE_MUST_BE_NUMBER
          }

          if (newNonce < safe.nonce) {
            return ErrorMessages.NONCE_TOO_LOW.replace('%%nonce%%', safe.nonce.toString())
          }

          if (newNonce >= Number.MAX_SAFE_INTEGER) {
            return ErrorMessages.NONCE_TOO_HIGH
          }

          if (!Number.isInteger(newNonce)) {
            return ErrorMessages.NONCE_MUST_BE_INTEGER
          }

          // Update context with valid nonce
          setNonce(newNonce)
        },
      }}
      render={({ field, fieldState }) => {
        if (readOnly) {
          return <TxNonceReadOnlyView nonce={nonce} />
        }

        const message = fieldState.error?.message || warning

        return (
          <TxNonceFormView
            name={field.name}
            value={field.value}
            inputRef={field.ref}
            onValueChange={(value) => field.onChange(_formatNumber(value))}
            onBlur={() => {
              field.onBlur()

              if (fieldState.error) {
                formMethods.setValue(field.name, recommendedNonce.toString(), { shouldValidate: true })
              }
            }}
            message={message}
            recommendedNonce={recommendedNonce}
            previousNonces={previousNonces}
            showRecommendedNonceButton={showRecommendedNonceButton}
            onReset={resetNonce}
            renderOption={(option) => <NonceFormOption nonce={option} />}
          />
        )
      }}
    />
  )
}

const TxNonce = ({ canEdit = true }: { canEdit?: boolean } = {}) => {
  const { nonce, recommendedNonce, isReadOnly } = useContext(SafeTxContext)

  return (
    <TxNonceView
      nonce={nonce}
      isLoading={nonce === undefined || recommendedNonce === undefined}
      form={
        nonce !== undefined && recommendedNonce !== undefined && canEdit && !isReadOnly ? (
          <TxNonceForm nonce={nonce.toString()} recommendedNonce={recommendedNonce.toString()} />
        ) : undefined
      }
    />
  )
}

export default TxNonce

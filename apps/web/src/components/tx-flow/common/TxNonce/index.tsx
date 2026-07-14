import { Fragment, memo, type ReactElement, useContext, useMemo, useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from '@/components/ui/combobox'
import { InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { _formatNumber } from '@/components/common/NumberField'
import { useQueuedTxByNonce } from '@/hooks/useTxQueue'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { getLatestTransactions } from '@/utils/tx-list'
import { getTransactionType } from '@/hooks/useTransactionType'
import usePreviousNonces from '@/hooks/usePreviousNonces'

import css from './styles.module.css'
import classNames from 'classnames'

const NonceFormOption = memo(function NonceFormOption({ nonce }: { nonce: string }): ReactElement {
  const addressBook = useAddressBook()
  const transactions = useQueuedTxByNonce(Number(nonce))

  const txLabel = useMemo(() => {
    const latestTransactions = getLatestTransactions(transactions)

    if (latestTransactions.length === 0) {
      return
    }

    const [{ transaction }] = latestTransactions
    return transaction.txInfo.humanDescription || `${getTransactionType(transaction, addressBook).text} transaction`
  }, [addressBook, transactions])

  const label = txLabel || 'New transaction'

  return (
    <Typography variant="paragraph-small">
      <b>{nonce}</b>&nbsp;- {label}
    </Typography>
  )
})

const getFieldMinWidth = (value: string): string => {
  const MIN_CHARS = 7
  const MAX_WIDTH = '200px'
  const clamped = `clamp(calc(${MIN_CHARS}ch + 6px), calc(${Math.max(MIN_CHARS, value.length)}ch + 6px), ${MAX_WIDTH})`
  return clamped
}

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
    formMethods.setValue(TxNonceFormFieldNames.NONCE, recommendedNonce)
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

  const options = [recommendedNonce, ...previousNonces]

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
          return (
            <Typography variant="paragraph-small-bold" className="-ml-2">
              {nonce}
            </Typography>
          )
        }

        const message = fieldState.error?.message || warning

        return (
          <Combobox
            items={options}
            inputValue={field.value}
            onInputValueChange={(value) => field.onChange(_formatNumber(value))}
            // Always surface the recommended/recent presets regardless of the typed value
            filter={() => true}
            inputRef={field.ref}
          >
            <Tooltip open={!!message}>
              <TooltipTrigger render={<div className="contents" />}>
                <ComboboxInput
                  name={field.name}
                  aria-label={message || undefined}
                  showTrigger
                  className="[&_input]:font-bold"
                  style={{ minWidth: getFieldMinWidth(field.value) }}
                  onBlur={() => {
                    field.onBlur()

                    if (fieldState.error) {
                      formMethods.setValue(field.name, recommendedNonce.toString())
                    }
                  }}
                >
                  {showRecommendedNonceButton && (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Reset to recommended nonce"
                        onClick={(event) => {
                          event.stopPropagation()
                          resetNonce()
                        }}
                      >
                        <RotateCcw className="size-4" />
                      </InputGroupButton>
                    </InputGroupAddon>
                  )}
                </ComboboxInput>
              </TooltipTrigger>
              {message && <TooltipContent side="top">{message}</TooltipContent>}
            </Tooltip>

            <ComboboxContent>
              <ComboboxList>
                {(option: string) => (
                  <Fragment key={option}>
                    {option === recommendedNonce && <ComboboxLabel>Recommended nonce</ComboboxLabel>}
                    {option === previousNonces[0] && <ComboboxLabel className="pt-3">Replace existing</ComboboxLabel>}
                    <ComboboxItem value={option}>
                      <NonceFormOption nonce={option} />
                    </ComboboxItem>
                  </Fragment>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )
      }}
    />
  )
}

const skeletonMinWidth = getFieldMinWidth('')

const TxNonce = ({ canEdit = true }: { canEdit?: boolean } = {}) => {
  const { nonce, recommendedNonce, isReadOnly } = useContext(SafeTxContext)

  return (
    <div data-testid="nonce-fld" className={classNames('flex items-center gap-2', css.nonce)}>
      Nonce{' '}
      <Typography variant="paragraph-bold" className="inline">
        #
      </Typography>
      {nonce === undefined || recommendedNonce === undefined ? (
        <Skeleton style={{ width: skeletonMinWidth }} className="h-[38px]" />
      ) : canEdit && !isReadOnly ? (
        <TxNonceForm nonce={nonce.toString()} recommendedNonce={recommendedNonce.toString()} />
      ) : (
        <Typography variant="paragraph-bold" className="-ml-2">
          {nonce}
        </Typography>
      )}
    </div>
  )
}

export default TxNonce

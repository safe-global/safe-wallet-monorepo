import { memo, type ReactElement, useContext, useMemo, useState, useEffect } from 'react'
import {
  Autocomplete,
  Box,
  IconButton,
  InputAdornment,
  Skeleton,
  Tooltip,
  Popper,
  type PopperProps,
  type MenuItemProps,
  MenuItem,
  Typography,
  ListSubheader,
  type ListSubheaderProps,
} from '@mui/material'
import { createFilterOptions } from '@mui/material/Autocomplete'
import { Controller, useForm } from 'react-hook-form'

import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import NumberField from '@/components/common/NumberField'
import { useQueuedTxByNonce } from '@/hooks/useTxQueue'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAddressBook from '@/hooks/useAddressBook'
import { getLatestTransactions } from '@/utils/tx-list'
import { getTransactionType } from '@/hooks/useTransactionType'
import usePreviousNonces from '@/hooks/usePreviousNonces'
import { isRejectionTx } from '@/utils/transactions'

import css from './styles.module.css'
import classNames from 'classnames'

const CustomPopper = function ({
  // Don't set width of Popper to that of the field
  className,
  ...props
}: PopperProps) {
  return <Popper {...props} className={classNames(className, css.popper)} style={undefined} placement="bottom-start" />
}

const NonceFormHeader = memo(function NonceFormSubheader({ children, ...props }: ListSubheaderProps) {
  return (
    <ListSubheader {...props} disableSticky>
      <Typography variant="caption" fontWeight={700} color="text.secondary">
        {children}
      </Typography>
    </ListSubheader>
  )
})

const NonceFormOption = memo(function NonceFormOption({
  nonce,
  menuItemProps,
}: {
  nonce: string
  menuItemProps: MenuItemProps
}): ReactElement {
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
    <MenuItem {...menuItemProps}>
      <Typography variant="body2">
        <b>{nonce}</b>&nbsp;- {label}
      </Typography>
    </MenuItem>
  )
})

const getFieldMinWidth = (value: string): string => {
  const MIN_CHARS = 7
  const MAX_WIDTH = '200px'
  const clamped = `clamp(calc(${MIN_CHARS}ch + 6px), calc(${Math.max(MIN_CHARS, value.length)}ch + 6px), ${MAX_WIDTH})`
  return clamped
}

const filter = createFilterOptions<string>()

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
  const previousNonces = usePreviousNonces().map((nonce) => nonce.toString())
  const { safe } = useSafeInfo()
  const [warning, setWarning] = useState<string>('')

  const showRecommendedNonceButton = recommendedNonce !== nonce
  const isEditable = !safeTx || safeTx?.signatures.size === 0
  const readOnly = !isEditable || isRejectionTx(safeTx)

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
            <Typography variant="body2" fontWeight={700} ml={-1}>
              {nonce}
            </Typography>
          )
        }

        return (
          <Autocomplete
            value={field.value}
            freeSolo
            onChange={(_, value) => field.onChange(value)}
            onInputChange={(_, value) => field.onChange(value)}
            onBlur={() => {
              field.onBlur()

              if (fieldState.error) {
                formMethods.setValue(field.name, recommendedNonce.toString())
              }
            }}
            options={[recommendedNonce, ...previousNonces]}
            getOptionLabel={(option) => option.toString()}
            filterOptions={(options, params) => {
              const filtered = filter(options, params)

              // Prevent segments from showing recommended, e.g. if recommended is 250, don't show for 2, 5 or 25
              const shouldShow = !recommendedNonce.includes(params.inputValue)
              const isQueued = options.some((option) => params.inputValue === option)

              if (params.inputValue !== '' && !isQueued && shouldShow) {
                filtered.push(recommendedNonce)
              }

              return filtered
            }}
            renderOption={(props, option) => {
              const isRecommendedNonce = option === recommendedNonce
              const isInitialPreviousNonce = option === previousNonces[0]

              const { key, ...rest } = props

              return (
                <div key={key}>
                  {isRecommendedNonce && <NonceFormHeader>Recommended nonce</NonceFormHeader>}
                  {isInitialPreviousNonce && <NonceFormHeader sx={{ pt: 3 }}>Replace existing</NonceFormHeader>}
                  <NonceFormOption menuItemProps={rest} nonce={option} />
                </div>
              )
            }}
            disableClearable
            componentsProps={{
              paper: {
                elevation: 2,
              },
            }}
            renderInput={(params) => {
              return (
                <Tooltip title={fieldState.error?.message || warning} open arrow placement="top">
                  <NumberField
                    {...params}
                    error={!!fieldState.error}
                    InputProps={{
                      ...params.InputProps,
                      name: field.name,
                      endAdornment: showRecommendedNonceButton ? (
                        <InputAdornment position="end" className={css.adornment}>
                          <Tooltip title="Reset to recommended nonce">
                            <IconButton onClick={resetNonce} size="small" color="primary">
                              <RotateLeftIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ) : null,
                    }}
                    className={classNames([
                      css.input,
                      {
                        [css.withAdornment]: showRecommendedNonceButton,
                      },
                    ])}
                    sx={{
                      minWidth: getFieldMinWidth(field.value),
                    }}
                  />
                </Tooltip>
              )
            }}
            PopperComponent={CustomPopper}
          />
        )
      }}
    />
  )
}

const skeletonMinWidth = getFieldMinWidth('')

const TxNonce = ({ canEdit = true }: { canEdit?: boolean } = {}) => {
  const { nonce, recommendedNonce, isReadOnly } = useContext(SafeTxContext)

  return (
    <Box data-testid="nonce-fld" display="flex" alignItems="center" gap={1}>
      Nonce{' '}
      <Typography component="span" fontWeight={700}>
        #
      </Typography>
      {nonce === undefined || recommendedNonce === undefined ? (
        <Skeleton width={skeletonMinWidth} height="38px" />
      ) : canEdit && !isReadOnly ? (
        <TxNonceForm nonce={nonce.toString()} recommendedNonce={recommendedNonce.toString()} />
      ) : (
        <Typography ml={-1} fontWeight={700}>
          {nonce}
        </Typography>
      )}
    </Box>
  )
}

export default TxNonce

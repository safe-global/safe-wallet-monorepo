import { useContext, useMemo } from 'react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { Button, CardActions, Divider, FormControl, Stack, SvgIcon, Typography } from '@mui/material'

import AddIcon from '@/public/images/common/add.svg'
import AddressBookInput from '@/components/common/AddressBookInput'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import TxCard from '@/components/tx-flow/common/TxCard'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../types'
import useIsSpendingLimitSupported from '../../hooks/useIsSpendingLimitSupported'
import SpendingLimitNotSupported from './SpendingLimitNotSupported'
import LimitRow from './LimitRow'

export { _validateSpendingLimit } from './validation'

const MAX_LIMITS = 5

const CreateSpendingLimit = () => {
  const isSupported = useIsSpendingLimitSupported()
  const { balances } = useVisibleBalances()
  const { onNext, data } = useContext<TxFlowContextType<NewSpendingLimitFlowProps>>(TxFlowContext)

  const formMethods = useForm<NewSpendingLimitFlowProps>({
    defaultValues: data,
    mode: 'onChange',
  })

  const { handleSubmit, watch, control, formState } = formMethods

  const beneficiary = watch(SpendingLimitFields.beneficiary)

  // Copilot address-poisoning check for the beneficiary
  useSafeShieldForAddressPoisoning([beneficiary])

  const { fields: limitFields, append, remove } = useFieldArray({ control, name: SpendingLimitFields.limits })

  const canAddMoreLimits = limitFields.length < MAX_LIMITS

  // Changing one row's token can make another row a duplicate, so all rows re-validate together
  const amountFieldNames = useMemo(
    () => limitFields.map((_, index) => `${SpendingLimitFields.limits}.${index}.${SpendingLimitFields.amount}`),
    [limitFields],
  )

  if (!isSupported) {
    return <SpendingLimitNotSupported />
  }

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onNext)}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <AddressBookInput
              data-testid="beneficiary-section"
              name={SpendingLimitFields.beneficiary}
              label="Beneficiary"
            />
          </FormControl>

          <Typography variant="h4" fontWeight={700}>
            Limits
          </Typography>
          <Typography mb={2}>
            Set an allowance per token. Each token refills automatically after its own reset time period.
          </Typography>

          <Stack spacing={4}>
            {limitFields.map((field, index) => (
              <LimitRow
                key={field.id}
                index={index}
                balances={balances.items}
                removable={limitFields.length > 1}
                onRemove={remove}
                amountFieldNames={amountFieldNames}
              />
            ))}
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" mt={3}>
            <Button
              data-testid="add-limit-btn"
              variant="text"
              onClick={() => append({ tokenAddress: ZERO_ADDRESS, amount: '', resetTime: '0' })}
              disabled={!canAddMoreLimits}
              startIcon={<SvgIcon component={AddIcon} inheritViewBox fontSize="small" />}
              size="large"
            >
              Add token
            </Button>
            <Typography
              data-testid="limits-count"
              variant="body2"
              color={canAddMoreLimits ? 'primary' : 'error.main'}
            >{`${limitFields.length}/${MAX_LIMITS}`}</Typography>
          </Stack>

          <Divider sx={{ mt: 2 }} />

          <CardActions>
            <Button data-testid="next-btn" variant="contained" type="submit" disabled={!formState.isValid}>
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default CreateSpendingLimit

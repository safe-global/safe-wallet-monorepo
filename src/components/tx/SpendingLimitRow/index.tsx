import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'
import { formatUnits } from '@ethersproject/units'
import { TokenInfo } from '@gnosis.pm/safe-react-gateway-sdk'
import { SpendingLimitState } from '@/store/spendingLimitsSlice'
import { SendTxType } from '@/components/tx/modals/TokenTransferModal/SendAssetsForm'

const SpendingLimitRow = ({
  spendingLimit,
  selectedToken,
}: {
  spendingLimit: SpendingLimitState
  selectedToken: TokenInfo | undefined
}) => {
  const { control } = useFormContext()

  const formattedAmount = formatUnits(spendingLimit.amount, selectedToken?.decimals)

  return (
    <>
      <Typography>Send as</Typography>
      <FormControl sx={{ mb: 2 }}>
        <Controller
          rules={{ required: true }}
          control={control}
          name="type"
          render={({ field }) => (
            <RadioGroup {...field} defaultValue={SendTxType.multiSig} name="type-button-group">
              <FormControlLabel
                value={SendTxType.multiSig}
                label="Multisig Transaction"
                control={<Radio />}
                componentsProps={{ typography: { variant: 'body2' } }}
              />
              <FormControlLabel
                value={SendTxType.spendingLimit}
                label={`Spending Limit Transaction (${formattedAmount} ${selectedToken?.symbol})`}
                control={<Radio />}
                componentsProps={{ typography: { variant: 'body2' } }}
              />
            </RadioGroup>
          )}
        />
      </FormControl>
    </>
  )
}

export default SpendingLimitRow

import { useTokenAmount, useVisibleTokens } from '@/components/tx-flow/flows/TokenTransfer/utils'
import madProps from '@/utils/mad-props'
import { type ReactElement, useContext, useEffect } from 'react'
import { type TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useSafeTokenAddress } from '@/components/common/SafeTokenWidget'
import useIsSafeTokenPaused from '@/hooks/useIsSafeTokenPaused'
import useIsOnlySpendingLimitBeneficiary from '@/hooks/useIsOnlySpendingLimitBeneficiary'
import { FormProvider, useForm } from 'react-hook-form'
import { sameAddress } from '@/utils/addresses'
import { Box, Button, CardActions, Divider, FormControl, Grid, SvgIcon, Typography } from '@mui/material'
import TokenIcon from '@/components/common/TokenIcon'
import AddressBookInput from '@/components/common/AddressBookInput'
import InfoIcon from '@/public/images/notifications/info.svg'
import SpendingLimitRow from '@/components/tx-flow/flows/TokenTransfer/SpendingLimitRow'
import { TokenTransferFields, type TokenTransferParams, TokenTransferType } from '.'
import TxCard from '../../common/TxCard'
import { formatVisualAmount } from '@/utils/formatters'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import TokenAmountInput from '@/components/common/TokenAmountInput'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'

export const AutocompleteItem = (item: { tokenInfo: TokenInfo; balance: string }): ReactElement => (
  <Grid container alignItems="center" gap={1}>
    <TokenIcon logoUri={item.tokenInfo.logoUri} key={item.tokenInfo.address} tokenSymbol={item.tokenInfo.symbol} />

    <Grid item xs>
      <Typography variant="body2" whiteSpace="normal">
        {item.tokenInfo.name}
      </Typography>

      {/* <Typography variant="caption" component="p">
        {formatVisualAmount(item.balance, item.tokenInfo.decimals)} {item.tokenInfo.symbol}
      </Typography> */}
    </Grid>
  </Grid>
)

export const CreateTokenTransfer = ({
  params,
  onSubmit,
  isSafeTokenPaused,
  safeTokenAddress,
  txNonce,
}: {
  params: TokenTransferParams
  onSubmit: (data: TokenTransferParams) => void
  isSafeTokenPaused: ReturnType<typeof useIsSafeTokenPaused>
  safeTokenAddress?: ReturnType<typeof useSafeTokenAddress>
  txNonce?: number
}): ReactElement => {
  const disableSpendingLimit = txNonce !== undefined
  const isOnlySpendingLimitBeneficiary = useIsOnlySpendingLimitBeneficiary()
  const balancesItems = useVisibleTokens()
  const { setNonce, setNonceNeeded } = useContext(SafeTxContext)

  useEffect(() => {
    if (txNonce !== undefined) {
      setNonce(txNonce)
    }
  }, [setNonce, txNonce])

  const formMethods = useForm<TokenTransferParams>({
    defaultValues: {
      ...params,
      [TokenTransferFields.type]: disableSpendingLimit
        ? TokenTransferType.multiSig
        : isOnlySpendingLimitBeneficiary
        ? TokenTransferType.spendingLimit
        : params.type,
      [TokenTransferFields.tokenAddress]: isOnlySpendingLimitBeneficiary
        ? balancesItems[0]?.tokenInfo.address
        : params.tokenAddress,
    },
    mode: 'onChange',
    delayError: 500,
  })

  const {
    handleSubmit,
    watch,
    formState: { errors },
  } = formMethods

  const recipient = watch(TokenTransferFields.recipient)
  const tokenAddress = watch(TokenTransferFields.tokenAddress)
  const type = watch(TokenTransferFields.type)

  const selectedToken = balancesItems.find((item) => item.tokenInfo.address === tokenAddress)
  const { totalAmount, spendingLimitAmount } = useTokenAmount(selectedToken)

  const isSpendingLimitType = type === TokenTransferType.spendingLimit

  const maxAmount = isSpendingLimitType && totalAmount > spendingLimitAmount ? spendingLimitAmount : totalAmount

  const isSafeTokenSelected = sameAddress(safeTokenAddress, tokenAddress)
  const isDisabled = isSafeTokenSelected && isSafeTokenPaused
  const isAddressValid = !!recipient && !errors[TokenTransferFields.recipient]

  useEffect(() => {
    setNonceNeeded(!isSpendingLimitType || spendingLimitAmount === 0n)
  }, [setNonceNeeded, isSpendingLimitType, spendingLimitAmount])

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)} className={commonCss.form}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <AddressBookInput name={TokenTransferFields.recipient} canAdd={isAddressValid} />
          </FormControl>

          <TokenAmountInput balances={balancesItems} selectedToken={selectedToken} maxAmount={maxAmount} />

          {!disableSpendingLimit && spendingLimitAmount > 0n && (
            <FormControl fullWidth sx={{ mt: 3 }}>
              <SpendingLimitRow availableAmount={spendingLimitAmount} selectedToken={selectedToken?.tokenInfo} />
            </FormControl>
          )}

          <Divider className={commonCss.nestedDivider} />

          <CardActions>
            <Button variant="contained" type="submit" disabled={isDisabled}>
              Next
            </Button>
          </CardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default madProps(CreateTokenTransfer, {
  safeTokenAddress: useSafeTokenAddress,
  isSafeTokenPaused: useIsSafeTokenPaused,
})

import React, { useCallback } from 'react'
import { TextInput } from 'react-native'
import { Text, View, getTokenValue } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeButton } from '@/src/components/SafeButton'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { AmountDisplay } from './components/AmountDisplay'
import { TokenPill } from './components/TokenPill'
import { useAmountInput } from './hooks/useAmountInput'
import { useFiatConversion } from './hooks/useFiatConversion'
import { isNativeToken } from './services/tokenTransferParams'

export function EnterAmountContainer() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const params = useLocalSearchParams<{ recipientAddress: string; tokenAddress: string }>()
  const { recipientAddress, tokenAddress } = params
  const activeSafe = useDefinedActiveSafe()
  const currency = useAppSelector(selectCurrency)

  const { data: balancesData } = useBalancesGetBalancesV1Query({
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
    fiatCode: currency,
  })

  const token = balancesData?.items.find((item) => {
    if (isNativeToken(tokenAddress)) {
      return item.tokenInfo.type === 'NATIVE_TOKEN'
    }
    return item.tokenInfo.address === tokenAddress
  })

  const decimals = (token?.tokenInfo.decimals as number) ?? 18
  const maxBalance = token?.balance ?? '0'

  const { rawInput, normalizedAmount, setRawInput, setMax, exceedsBalance, exceedsDecimals, isValid } = useAmountInput({
    decimals,
    maxBalance,
  })

  const fiatConversion = useFiatConversion({
    amount: normalizedAmount,
    fiatConversion: token?.fiatConversion,
    currency,
    symbol: token?.tokenInfo.symbol ?? '',
  })

  const handleReview = useCallback(() => {
    if (!isValid) {
      return
    }

    router.push({
      pathname: '/(send)/review',
      params: {
        recipientAddress,
        tokenAddress,
        amount: normalizedAmount,
      },
    })
  }, [isValid, recipientAddress, tokenAddress, normalizedAmount, router])

  const errorMessage = exceedsBalance
    ? 'Insufficient balance'
    : exceedsDecimals
      ? `Should have 1 to ${decimals} decimals`
      : undefined

  return (
    <View flex={1}>
      <View flex={1} justifyContent="center" alignItems="center" padding="$4">
        <AmountDisplay
          primaryDisplay={fiatConversion.primaryDisplay}
          secondaryDisplay={fiatConversion.secondaryDisplay}
          onToggle={fiatConversion.toggleMode}
          canToggle={fiatConversion.hasFiatPrice}
        />

        <TokenPill symbol={token?.tokenInfo.symbol ?? ''} logoUri={token?.tokenInfo.logoUri} onMaxPress={setMax} />

        <TextInput
          value={rawInput}
          onChangeText={setRawInput}
          keyboardType="decimal-pad"
          style={{
            fontSize: 24,
            textAlign: 'center',
            width: '100%',
            marginTop: 24,
            padding: 12,
          }}
          placeholder="0"
          testID="amount-input"
        />

        {errorMessage && (
          <Text color="$error" fontSize="$3" marginTop="$2" testID="amount-error">
            {errorMessage}
          </Text>
        )}
      </View>

      <View
        paddingHorizontal="$4"
        paddingTop="$3"
        paddingBottom={Math.max(bottom, getTokenValue('$4'))}
        borderTopWidth={1}
        borderTopColor="$borderLight"
      >
        <SafeButton onPress={handleReview} disabled={!isValid} testID="review-button">
          Review & confirm
        </SafeButton>
      </View>
    </View>
  )
}

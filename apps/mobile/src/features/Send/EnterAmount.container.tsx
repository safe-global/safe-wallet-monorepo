import React, { useCallback, useMemo, useRef } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native'
import { Text, View, getTokenValue } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { shortenAddress } from '@/src/utils/formatters'
import {
  formatVisualAmount,
  safeFormatUnits,
} from '@safe-global/utils/utils/formatters'
import { AmountDisplay } from './components/AmountDisplay'
import { TokenPill } from './components/TokenPill'
import {
  useAmountInput,
  useTokenAmountValidation,
} from './hooks/useAmountInput'
import { useFiatConversion } from './hooks/useFiatConversion'
import { isNativeToken } from './services/tokenTransferParams'

export function EnterAmountContainer() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  const params = useLocalSearchParams<{
    recipientAddress: string
    recipientName?: string
    tokenAddress: string
  }>()
  const { recipientAddress, recipientName, tokenAddress } = params
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

  const hasFiatPrice =
    !!token?.fiatConversion && parseFloat(token.fiatConversion) > 0

  const { rawInput, setRawInput, setMax } = useAmountInput()

  const fiatConversion = useFiatConversion({
    rawInput,
    fiatRate: token?.fiatConversion,
    currency,
    symbol: token?.tokenInfo.symbol ?? '',
    decimals,
  })

  const inputMaxDecimals =
    fiatConversion.isFiatMode && hasFiatPrice ? 2 : decimals

  const handleInputChange = useCallback(
    (value: string) => setRawInput(value, inputMaxDecimals),
    [setRawInput, inputMaxDecimals],
  )

  const { exceedsBalance, exceedsDecimals, isValid } =
    useTokenAmountValidation({
      tokenAmount: fiatConversion.tokenAmount,
      decimals,
      maxBalance,
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
        amount: fiatConversion.tokenAmount,
      },
    })
  }, [
    isValid,
    recipientAddress,
    tokenAddress,
    fiatConversion.tokenAmount,
    router,
  ])

  const handleMax = useCallback(() => {
    const formatted = safeFormatUnits(maxBalance, decimals)
    if (!formatted) {
      return
    }

    if (fiatConversion.isFiatMode && fiatConversion.hasFiatPrice) {
      const rate = parseFloat(token?.fiatConversion ?? '0')
      if (rate > 0) {
        const fiatMax = (parseFloat(formatted) * rate).toFixed(2)
        setMax(fiatMax)
        return
      }
    }
    setMax(formatted)
  }, [
    maxBalance,
    decimals,
    fiatConversion.isFiatMode,
    fiatConversion.hasFiatPrice,
    token?.fiatConversion,
    setMax,
  ])

  const errorMessage = exceedsBalance
    ? 'Insufficient balance'
    : exceedsDecimals
      ? `Should have 1 to ${decimals} decimals`
      : undefined

  const formattedBalance = useMemo(() => {
    return token ? formatVisualAmount(maxBalance, decimals) : undefined
  }, [token, maxBalance, decimals])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recipient header */}
        <View paddingHorizontal="$4" paddingTop="$3" gap="$2">
          <View flexDirection="row" alignItems="center" gap="$2">
            <SafeFontIcon
              name="send-to"
              size={16}
              color="$colorSecondary"
            />
            <Text fontSize="$4" color="$colorSecondary">
              Recipient
            </Text>
          </View>
          <Pressable
            onPress={() => router.navigate('/(send)/recipient')}
            testID="recipient-summary"
          >
            <View
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              backgroundColor="$backgroundSkeleton"
              borderRadius={8}
              paddingLeft="$4"
              paddingRight="$2"
              height={64}
            >
              <View
                flexDirection="row"
                alignItems="baseline"
                gap="$2"
              >
                <Text fontSize="$4" color="$colorSecondary">
                  To:
                </Text>
                <Text fontSize={16} color="$color">
                  {recipientName ??
                    shortenAddress(recipientAddress ?? '', 6)}
                </Text>
              </View>
              <SafeFontIcon
                name="chevron-right"
                size={20}
                color="$colorSecondary"
              />
            </View>
          </Pressable>
        </View>

        {/* Amount content area */}
        <Pressable
          style={{ flex: 1 }}
          onPress={() => inputRef.current?.focus()}
        >
          <View
            flex={1}
            justifyContent="center"
            alignItems="center"
            paddingHorizontal="$4"
            paddingVertical="$6"
          >
            <AmountDisplay
              primaryDisplay={fiatConversion.primaryDisplay}
              secondaryDisplay={fiatConversion.secondaryDisplay}
              onToggle={fiatConversion.toggleMode}
              canToggle={fiatConversion.hasFiatPrice}
            />

          <View
            flexDirection="row"
            alignItems="center"
            gap="$2"
            marginTop="$6"
          >
            <TokenPill
              symbol={token?.tokenInfo.symbol ?? ''}
              logoUri={token?.tokenInfo.logoUri}
              balance={formattedBalance}
              onMaxPress={handleMax}
            />
            {fiatConversion.hasFiatPrice && (
              <Pressable
                onPress={fiatConversion.toggleMode}
                testID="toggle-fiat-button"
              >
                <View
                  width={40}
                  height={40}
                  borderRadius={80}
                  backgroundColor="$backgroundSkeleton"
                  alignItems="center"
                  justifyContent="center"
                >
                  <SafeFontIcon
                    name="arrow-sort"
                    size={16}
                    color="$color"
                  />
                </View>
              </Pressable>
            )}
          </View>

          <TextInput
            ref={inputRef}
            value={rawInput}
            onChangeText={handleInputChange}
            keyboardType="decimal-pad"
            style={{
              fontSize: 1,
              opacity: 0,
              position: 'absolute',
              width: 1,
              height: 1,
            }}
            autoFocus
            testID="amount-input"
          />

          <View height={24} marginTop="$3" justifyContent="center">
            {errorMessage && (
              <Text
                color="$error"
                fontSize="$3"
                testID="amount-error"
              >
                {errorMessage}
              </Text>
            )}
          </View>
          </View>
        </Pressable>
      </ScrollView>

      {/* Review button — stays above keyboard */}
      <View
        paddingHorizontal="$4"
        paddingTop="$3"
        paddingBottom={Math.max(bottom, getTokenValue('$4'))}
      >
        <SafeButton
          onPress={handleReview}
          disabled={!isValid}
          testID="review-button"
        >
          Review & confirm
        </SafeButton>
      </View>
    </KeyboardAvoidingView>
  )
}

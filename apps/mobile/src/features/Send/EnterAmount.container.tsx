import React, { useCallback, useRef } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput } from 'react-native'
import { Text, View } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Alert } from '@/src/components/Alert'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { AmountDisplay } from './components/AmountDisplay'
import { TokenPill } from './components/TokenPill'
import { RecipientHeader } from './components/RecipientHeader'
import { FooterAction } from './components/FooterAction'
import { NonceBottomSheet } from './components/NonceBottomSheet'
import { CustomNonceModal } from './components/CustomNonceModal'
import { useAmountInput, useTokenAmountValidation } from './hooks/useAmountInput'
import { useFiatConversion } from './hooks/useFiatConversion'
import { useKeyboardVisible } from './hooks/useKeyboardVisible'
import { useNonceSelection } from './hooks/useNonceSelection'
import { useTokenBalance } from './hooks/useTokenBalance'
import { useSendTransaction } from './hooks/useSendTransaction'

const FIAT_DECIMALS = 2
const isIos = Platform.OS === 'ios'
const keyboardBehavior = isIos ? 'padding' : undefined
const keyboardOffset = isIos ? 100 : 0

/** Compute the fiat-denominated max when in fiat mode. */
function computeFiatMax(formatted: string, fiatRate: string | undefined): string | undefined {
  const rate = parseFloat(fiatRate ?? '0')
  if (rate <= 0) {
    return undefined
  }
  return (parseFloat(formatted) * rate).toFixed(FIAT_DECIMALS)
}

/** Build the decimal-error message, if any. */
function getDecimalError(exceedsDecimals: boolean, decimals: number): string | undefined {
  if (!exceedsDecimals) {
    return undefined
  }
  return `Should have 1 to ${decimals} decimals`
}

function FiatToggleButton({ onToggle }: { onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} testID="toggle-fiat-button">
      <View
        width={40}
        height={40}
        borderRadius={80}
        backgroundColor="$backgroundSkeleton"
        alignItems="center"
        justifyContent="center"
      >
        <SafeFontIcon name="transactions" size={24} color="$color" />
      </View>
    </Pressable>
  )
}

export function EnterAmountContainer() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  const params = useLocalSearchParams<{
    recipientAddress: string
    recipientName?: string
    tokenAddress: string
  }>()
  const recipientAddress = params.recipientAddress ?? ''
  const recipientName = params.recipientName
  const tokenAddress = params.tokenAddress ?? ''
  const activeSafe = useDefinedActiveSafe()
  const currency = useAppSelector(selectCurrency)
  const keyboardVisible = useKeyboardVisible()

  const { token, decimals, maxBalance, hasFiatPrice, formattedBalance } = useTokenBalance({
    tokenAddress,
  })

  const nonce = useNonceSelection({
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
    inputRef,
  })

  const { rawInput, setRawInput, setMax } = useAmountInput()

  const tokenSymbol = token?.tokenInfo.symbol ?? ''
  const fiatConversion = useFiatConversion({
    rawInput,
    fiatRate: token?.fiatConversion,
    currency,
    symbol: tokenSymbol,
    decimals,
  })

  const inputMaxDecimals = fiatConversion.isFiatMode && hasFiatPrice ? FIAT_DECIMALS : decimals

  const handleInputChange = useCallback(
    (value: string) => setRawInput(value, inputMaxDecimals),
    [setRawInput, inputMaxDecimals],
  )

  const { exceedsBalance, exceedsDecimals, isValid } = useTokenAmountValidation({
    tokenAmount: fiatConversion.tokenAmount,
    decimals,
    maxBalance,
  })

  const { submitError, activeSigner, handleReview, isSubmitting } = useSendTransaction({
    recipientAddress,
    tokenAddress,
    tokenAmount: fiatConversion.tokenAmount,
    decimals,
    isValid,
    selectedNonce: nonce.selectedNonce,
  })

  const handleMax = useCallback(() => {
    const formatted = safeFormatUnits(maxBalance, decimals)
    if (!formatted) {
      return
    }

    if (fiatConversion.isFiatMode && fiatConversion.hasFiatPrice) {
      const fiatMax = computeFiatMax(formatted, token?.fiatConversion)
      setMax(fiatMax ?? formatted)
      return
    }

    setMax(formatted)
  }, [maxBalance, decimals, fiatConversion.isFiatMode, fiatConversion.hasFiatPrice, token?.fiatConversion, setMax])

  const inlineError = getDecimalError(exceedsDecimals, decimals)

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior} keyboardVerticalOffset={keyboardOffset}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} keyboardShouldPersistTaps="handled">
        <RecipientHeader
          recipientAddress={recipientAddress}
          recipientName={recipientName}
          displayNonce={nonce.displayNonce}
          onRecipientPress={() => router.navigate('/(send)/recipient')}
          onNoncePress={nonce.handleOpenNonceSheet}
        />

        <Pressable style={{ flex: 1 }} onPress={() => inputRef.current?.focus()}>
          <View flex={1} justifyContent="center" alignItems="center" paddingHorizontal="$4" paddingVertical="$6">
            <AmountDisplay
              primaryDisplay={fiatConversion.primaryDisplay}
              secondaryDisplay={fiatConversion.secondaryDisplay}
              onToggle={fiatConversion.toggleMode}
              canToggle={fiatConversion.hasFiatPrice}
            />

            <View flexDirection="row" alignItems="center" gap="$2" marginTop="$6">
              <TokenPill
                symbol={tokenSymbol}
                logoUri={token?.tokenInfo.logoUri}
                balance={formattedBalance}
                onMaxPress={handleMax}
              />
              {fiatConversion.hasFiatPrice && <FiatToggleButton onToggle={fiatConversion.toggleMode} />}
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
              {inlineError && (
                <Text color="$error" fontSize="$3" testID="amount-error">
                  {inlineError}
                </Text>
              )}
            </View>

            {submitError && (
              <View marginTop="$3" paddingHorizontal="$4">
                <Alert type="error" message={submitError} />
              </View>
            )}
          </View>
        </Pressable>
      </ScrollView>

      <FooterAction
        exceedsBalance={exceedsBalance}
        isValid={isValid}
        hasActiveSigner={!!activeSigner}
        isSubmitting={isSubmitting}
        keyboardVisible={keyboardVisible}
        bottomInset={bottom}
        onReview={handleReview}
      />

      <NonceBottomSheet
        ref={nonce.nonceSheetRef}
        recommendedNonce={nonce.recommendedNonce}
        queuedNonces={nonce.queuedNonces}
        selectedNonce={nonce.selectedNonce}
        onSelectNonce={nonce.handleSelectNonce}
        onAddCustomNonce={nonce.handleAddCustomNonce}
        onEndReached={nonce.fetchMore}
        isFetchingMore={nonce.isFetchingMore}
      />

      <CustomNonceModal
        visible={nonce.showCustomNonceModal}
        defaultNonce={String(nonce.displayNonce ?? '')}
        currentNonce={nonce.currentNonce ?? 0}
        onSave={nonce.handleSaveCustomNonce}
        onCancel={nonce.handleCancelCustomNonce}
      />
    </KeyboardAvoidingView>
  )
}

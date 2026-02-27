import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput } from 'react-native'
import { Text, View, getTokenValue } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Alert } from '@/src/components/Alert'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { shortenAddress } from '@/src/utils/formatters'
import { formatVisualAmount, safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { AmountDisplay } from './components/AmountDisplay'
import { TokenPill } from './components/TokenPill'
import { NonceBottomSheet } from './components/NonceBottomSheet'
import { CustomNonceModal } from './components/CustomNonceModal'
import { useAmountInput, useTokenAmountValidation } from './hooks/useAmountInput'
import { useFiatConversion } from './hooks/useFiatConversion'
import { useNonce } from './hooks/useNonce'
import { isNativeToken } from './services/tokenTransferParams'
import { proposeSendTransaction } from './services/proposeSendTransaction'
import logger from '@/src/utils/logger'

export function EnterAmountContainer() {
  const router = useRouter()
  const { bottom } = useSafeAreaInsets()
  const inputRef = useRef<TextInput>(null)
  const nonceSheetRef = useRef<BottomSheetModal>(null)
  const params = useLocalSearchParams<{
    recipientAddress: string
    recipientName?: string
    tokenAddress: string
  }>()
  const { recipientAddress, recipientName, tokenAddress } = params
  const activeSafe = useDefinedActiveSafe()
  const dispatch = useAppDispatch()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const currency = useAppSelector(selectCurrency)
  const isSubmitting = useRef(false)
  const [submitError, setSubmitError] = useState<string>()
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  // Nonce state
  const { recommendedNonce, queuedNonces, fetchMore, isFetchingMore } = useNonce(activeSafe.chainId, activeSafe.address)
  const [selectedNonce, setSelectedNonce] = useState<number | undefined>()
  const [showCustomNonceModal, setShowCustomNonceModal] = useState(false)

  const displayNonce = selectedNonce ?? recommendedNonce

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

  const hasFiatPrice = !!token?.fiatConversion && parseFloat(token.fiatConversion) > 0

  const { rawInput, setRawInput, setMax } = useAmountInput()

  const fiatConversion = useFiatConversion({
    rawInput,
    fiatRate: token?.fiatConversion,
    currency,
    symbol: token?.tokenInfo.symbol ?? '',
    decimals,
  })

  const inputMaxDecimals = fiatConversion.isFiatMode && hasFiatPrice ? 2 : decimals

  const handleInputChange = useCallback(
    (value: string) => setRawInput(value, inputMaxDecimals),
    [setRawInput, inputMaxDecimals],
  )

  const { exceedsBalance, exceedsDecimals, isValid } = useTokenAmountValidation({
    tokenAmount: fiatConversion.tokenAmount,
    decimals,
    maxBalance,
  })

  const handleReview = useCallback(async () => {
    if (!isValid || isSubmitting.current || !activeSigner) {
      return
    }
    isSubmitting.current = true
    setSubmitError(undefined)

    try {
      const txId = await proposeSendTransaction({
        recipient: recipientAddress ?? '',
        tokenAddress: tokenAddress ?? '',
        amount: fiatConversion.tokenAmount,
        decimals,
        chainId: activeSafe.chainId,
        safeAddress: activeSafe.address,
        sender: activeSigner.value,
        dispatch,
        nonce: selectedNonce,
      })

      router.push({
        pathname: '/confirm-transaction',
        params: { txId },
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create transaction'
      logger.error('Send transaction proposal failed:', e)
      setSubmitError(message)
    } finally {
      isSubmitting.current = false
    }
  }, [
    isValid,
    activeSigner,
    recipientAddress,
    tokenAddress,
    fiatConversion.tokenAmount,
    decimals,
    activeSafe,
    dispatch,
    router,
    selectedNonce,
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
  }, [maxBalance, decimals, fiatConversion.isFiatMode, fiatConversion.hasFiatPrice, token?.fiatConversion, setMax])

  const handleOpenNonceSheet = useCallback(() => {
    Keyboard.dismiss()
    nonceSheetRef.current?.present()
  }, [])

  const refocusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [])

  const handleSelectNonce = useCallback(
    (nonce: number) => {
      setSelectedNonce(nonce === recommendedNonce ? undefined : nonce)
      nonceSheetRef.current?.dismiss()
      refocusInput()
    },
    [recommendedNonce, refocusInput],
  )

  const handleAddCustomNonce = useCallback(() => {
    nonceSheetRef.current?.dismiss()
    // Small delay to avoid bottom sheet and modal fighting
    setTimeout(() => {
      setShowCustomNonceModal(true)
    }, 300)
  }, [])

  const handleSaveCustomNonce = useCallback(
    (nonce: number) => {
      setSelectedNonce(nonce === recommendedNonce ? undefined : nonce)
      setShowCustomNonceModal(false)
      refocusInput()
    },
    [recommendedNonce, refocusInput],
  )

  const handleCancelCustomNonce = useCallback(() => {
    setShowCustomNonceModal(false)
    refocusInput()
  }, [refocusInput])

  const inlineError = exceedsDecimals ? `Should have 1 to ${decimals} decimals` : undefined

  const formattedBalance = useMemo(() => {
    return token ? formatVisualAmount(maxBalance, decimals) : undefined
  }, [token, maxBalance, decimals])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} keyboardShouldPersistTaps="handled">
        {/* Recipient and Nonce header */}
        <View paddingHorizontal="$4" paddingTop="$3" flexDirection="row" gap="$2">
          {/* Recipient column */}
          <View flex={1} gap="$2">
            <View flexDirection="row" alignItems="center" gap="$2">
              <SafeFontIcon name="send-to" size={16} color="$color" />
              <Text fontSize="$4" color="$color">
                Recipient
              </Text>
            </View>
            <Pressable onPress={() => router.navigate('/(send)/recipient')} testID="recipient-summary">
              <View
                flexDirection="row"
                alignItems="center"
                backgroundColor="$backgroundSkeleton"
                borderRadius={8}
                paddingHorizontal="$4"
                height={64}
                gap="$2"
              >
                <Text fontSize="$4" color="$colorSecondary">
                  To:
                </Text>
                {recipientName ? (
                  <View gap={2}>
                    <Text fontSize="$4" fontWeight={600} color="$color">
                      {recipientName}
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary">
                      {shortenAddress(recipientAddress ?? '', 4)}
                    </Text>
                  </View>
                ) : (
                  <Text fontSize="$4" color="$color">
                    {shortenAddress(recipientAddress ?? '', 6)}
                  </Text>
                )}
              </View>
            </Pressable>
          </View>

          {/* Nonce column */}
          <View gap="$2" minWidth={100}>
            <View flexDirection="row" alignItems="center" gap="$2">
              <SafeFontIcon name="apps" size={16} color="$color" />
              <Text fontSize="$4" color="$color">
                Nonce
              </Text>
            </View>
            <Pressable onPress={handleOpenNonceSheet} testID="nonce-display">
              <View
                alignItems="center"
                justifyContent="center"
                backgroundColor="$backgroundSkeleton"
                borderRadius={8}
                paddingHorizontal="$4"
                height={64}
              >
                <Text fontSize="$4" color="$color">
                  {displayNonce !== undefined ? `# ${displayNonce}` : '—'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Amount content area */}
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
                symbol={token?.tokenInfo.symbol ?? ''}
                logoUri={token?.tokenInfo.logoUri}
                balance={formattedBalance}
                onMaxPress={handleMax}
              />
              {fiatConversion.hasFiatPrice && (
                <Pressable onPress={fiatConversion.toggleMode} testID="toggle-fiat-button">
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

      {/* Review button or insufficient balance alert — stays above keyboard */}
      <View
        paddingHorizontal="$4"
        paddingTop="$3"
        paddingBottom={keyboardVisible ? getTokenValue('$4') : Math.max(bottom, getTokenValue('$4'))}
      >
        {exceedsBalance ? (
          <Alert type="error" message="Insufficient balance" testID="insufficient-balance-alert" />
        ) : (
          <SafeButton
            onPress={handleReview}
            disabled={!isValid || !activeSigner || isSubmitting.current}
            testID="review-button"
          >
            Review & confirm
          </SafeButton>
        )}
      </View>

      {/* Nonce bottom sheet */}
      <NonceBottomSheet
        ref={nonceSheetRef}
        recommendedNonce={recommendedNonce}
        queuedNonces={queuedNonces}
        selectedNonce={selectedNonce}
        onSelectNonce={handleSelectNonce}
        onAddCustomNonce={handleAddCustomNonce}
        onEndReached={fetchMore}
        isFetchingMore={isFetchingMore}
      />

      {/* Custom nonce modal */}
      <CustomNonceModal
        visible={showCustomNonceModal}
        defaultNonce={String(displayNonce ?? '')}
        onSave={handleSaveCustomNonce}
        onCancel={handleCancelCustomNonce}
      />
    </KeyboardAvoidingView>
  )
}

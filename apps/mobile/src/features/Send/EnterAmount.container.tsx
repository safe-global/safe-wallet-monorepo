import React, { useEffect, useRef } from 'react'
import { Pressable, ScrollView, TextInput } from 'react-native'
import { Text, View } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { Alert } from '@/src/components/Alert'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useHeaderHeight } from '@/src/hooks/useHeaderHeight'
import { AmountDisplay } from './components/AmountDisplay'
import { TokenPill } from './components/TokenPill'
import { RecipientHeader } from './components/RecipientHeader'
import { FooterAction } from './components/FooterAction'
import { NonceBottomSheet } from './components/NonceBottomSheet'
import { CustomNonceModal } from './components/CustomNonceModal'
import { ProposerBottomSheet } from './components/ProposerBottomSheet'
import { useAmountInput, useTokenAmountValidation } from './hooks/useAmountInput'
import { useFiatConversion } from './hooks/useFiatConversion'
import { useMaxAmount } from './hooks/useMaxAmount'
import { useNonceSelection } from './hooks/useNonceSelection'
import { useTokenBalance } from './hooks/useTokenBalance'
import { useSendTransaction } from './hooks/useSendTransaction'
import { useEnsureActiveSigner } from './hooks/useEnsureActiveSigner'
import { useProposerSheet } from './hooks/useProposerSheet'
import { Address } from '@/src/types/address'

const keyboardBehavior = 'padding' as const

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
  const headerHeight = useHeaderHeight()
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

  const { token, decimals, maxBalance, formattedBalance, isTokenDataReady } = useTokenBalance({
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
    onRawInputChange: setMax,
  })

  const { exceedsBalance, exceedsDecimals, isValid } = useTokenAmountValidation({
    tokenAmount: fiatConversion.tokenAmount,
    decimals,
    maxBalance,
  })

  const { handleMax, handleInputChange, inlineError } = useMaxAmount({
    maxBalance,
    decimals,
    isFiatMode: fiatConversion.isFiatMode,
    hasFiatPrice: fiatConversion.hasFiatPrice,
    fiatRate: token?.fiatConversion,
    setRawInput,
    setMax,
    exceedsDecimals,
  })

  const { activeSigner, availableSigners, ensureActiveSigner } = useEnsureActiveSigner()

  useEffect(() => ensureActiveSigner(), [])
  const proposer = useProposerSheet({ safeAddress: activeSafe.address, inputRef })
  const { submitError, handleReview, isSubmitting } = useSendTransaction({
    recipientAddress,
    tokenAddress,
    tokenAmount: fiatConversion.tokenAmount,
    decimals,
    isValid: isValid && isTokenDataReady,
    selectedNonce: nonce.selectedNonce ?? nonce.recommendedNonce,
    sender: activeSigner?.value,
  })

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardBehavior} keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} keyboardShouldPersistTaps="handled">
        <RecipientHeader
          recipientAddress={recipientAddress}
          recipientName={recipientName}
          displayNonce={nonce.displayNonce}
          onRecipientPress={() => router.dismissTo('/(send)/recipient')}
          onNoncePress={nonce.handleOpenNonceSheet}
        />

        <Pressable style={{ flex: 1 }} onPress={() => inputRef.current?.focus()}>
          <View flex={1} justifyContent="center" alignItems="center" paddingHorizontal="$4" paddingVertical="$6">
            <AmountDisplay
              primaryDisplay={fiatConversion.primaryDisplay}
              secondaryDisplay={fiatConversion.secondaryDisplay}
              onToggle={fiatConversion.toggleMode}
              canToggle={fiatConversion.hasFiatPrice}
              hasValue={rawInput.length > 0}
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
        activeSigner={activeSigner}
        availableSigners={availableSigners}
        isSubmitting={isSubmitting}
        onReview={handleReview}
        onOpenSignerSheet={proposer.handleOpenProposerSheet}
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

      <ProposerBottomSheet
        ref={proposer.proposerSheetRef}
        availableSigners={availableSigners}
        selectedAddress={activeSigner?.value as Address | undefined}
        onSelectSigner={proposer.handleSelectProposer}
        onChange={proposer.handleProposerSheetChange}
      />
    </KeyboardAvoidingView>
  )
}

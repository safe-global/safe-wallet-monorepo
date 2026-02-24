import React, { useCallback, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, Text, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeButton } from '@/src/components/SafeButton'
import { Loader } from '@/src/components/Loader'
import { Alert } from '@/src/components/Alert'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { selectCurrency } from '@/src/store/settingsSlice'
import { useBuildSendTransaction } from './hooks/useBuildSendTransaction'
import { createSendTransaction } from './services/createSendTransaction'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { shortenAddress } from '@/src/utils/formatters'
import { isNativeToken } from './services/tokenTransferParams'
import logger from '@/src/utils/logger'

export function ReviewSendContainer() {
  const params = useLocalSearchParams<{ recipientAddress: string; tokenAddress: string; amount: string }>()
  const { recipientAddress, tokenAddress, amount } = params
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { bottom } = useSafeAreaInsets()
  const activeSafe = useDefinedActiveSafe()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const currency = useAppSelector(selectCurrency)
  const isSubmitting = useRef(false)
  const [submitError, setSubmitError] = useState<string>()

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

  const decimals = token?.tokenInfo.decimals ?? 18

  const {
    preview,
    isLoading,
    error: buildError,
  } = useBuildSendTransaction({
    recipientAddress,
    tokenAddress,
    amount,
    decimals,
  })

  const handleSign = useCallback(async () => {
    if (isSubmitting.current || !activeSigner) {
      return
    }
    isSubmitting.current = true
    setSubmitError(undefined)

    try {
      await createSendTransaction({
        recipient: recipientAddress,
        tokenAddress,
        amount,
        decimals,
        chainId: activeSafe.chainId,
        safeAddress: activeSafe.address,
        sender: activeSigner.value,
        dispatch,
      })

      router.dismissAll()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to send transaction'
      logger.error('Send transaction failed:', e)
      setSubmitError(message)
    } finally {
      isSubmitting.current = false
    }
  }, [activeSigner, recipientAddress, tokenAddress, amount, decimals, activeSafe, dispatch, router])

  if (!recipientAddress || !tokenAddress || !amount) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text color="$colorSecondary">Missing transaction parameters</Text>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Loader size={48} color="#12FF80" />
      </View>
    )
  }

  if (buildError) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Alert type="error" message={buildError} />
      </View>
    )
  }

  const formattedAmount = token ? `${formatVisualAmount(amount, decimals)} ${token.tokenInfo.symbol}` : amount

  const fiatValue = token?.fiatConversion
    ? formatCurrency((parseFloat(amount) * parseFloat(token.fiatConversion)).toString(), currency)
    : undefined

  return (
    <View flex={1}>
      <ScrollView flex={1} contentContainerStyle={{ padding: 16 }}>
        <View gap="$4">
          <View gap="$2">
            <Text fontSize="$3" color="$colorSecondary">
              Send
            </Text>
            <Text fontSize="$6" fontWeight={600}>
              {formattedAmount}
            </Text>
            {fiatValue && (
              <Text fontSize="$4" color="$colorSecondary">
                {fiatValue}
              </Text>
            )}
          </View>

          <View gap="$2">
            <Text fontSize="$3" color="$colorSecondary">
              To
            </Text>
            <Text fontSize="$4" fontWeight={500}>
              {shortenAddress(recipientAddress, 8)}
            </Text>
          </View>

          {preview?.txInfo && (
            <View gap="$2">
              <Text fontSize="$3" color="$colorSecondary">
                Transaction type
              </Text>
              <Text fontSize="$4">{'type' in preview.txInfo ? preview.txInfo.type : 'Transfer'}</Text>
            </View>
          )}

          {!activeSigner && (
            <Alert type="warning" message="No signer available. Import a signer to sign transactions." />
          )}

          {submitError && <Alert type="error" message={submitError} />}
        </View>
      </ScrollView>

      <View
        paddingHorizontal="$4"
        paddingTop="$3"
        paddingBottom={Math.max(bottom, 16)}
        borderTopWidth={1}
        borderTopColor="$borderLight"
      >
        <SafeButton onPress={handleSign} disabled={!activeSigner || isSubmitting.current}>
          Sign
        </SafeButton>
      </View>
    </View>
  )
}

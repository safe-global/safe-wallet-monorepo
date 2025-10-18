import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import React from 'react'
import { Text, View, ScrollView } from 'tamagui'
import { Container } from '@/src/components/Container'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SignersCard } from '@/src/components/transactions-list/Card/SignersCard'
import { Address } from 'blo'
import { SignerInfo } from '@/src/types/address'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { selectChainById } from '@/src/store/chains'
import { ContactDisplayNameContainer } from '@/src/features/AddressBook'
import { useTxSignerActions } from '@/src/features/ConfirmTx/hooks/useTxSignerActions'
import useAvailableSigners from '@/src/features/ChangeSignerSheet/useAvailableSigners'
import { ActionType } from '@/src/features/ChangeSignerSheet/utils'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import useGasFee from '@/src/features/ExecuteTx/hooks/useGasFee'
import { selectEstimatedFee } from '@/src/store/estimatedFeeSlice'
import { setExecutionMethod, selectExecutionMethod } from '@/src/store/executionMethodSlice'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTotalFee } from '@safe-global/utils/hooks/useDefaultGasPrice'
import { toBigInt } from 'ethers'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { ExecutionMethod } from './types'
import { useRelayGetRelaysRemainingV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { RelayAvailable } from './components/RelayAvailable/RelayAvailable'
import { RelayUnavailable } from './components/RelayUnavailable/RelayUnavailable'
import { hasFeature } from '@safe-global/utils/utils/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppDispatch } from '@/src/store/hooks'

const getActiveSignerRightNode = (
  totalFee: bigint,
  item: SignerInfo & { balance: string },
  executionMethod: ExecutionMethod,
  activeSigner?: SignerInfo,
) => {
  if (activeSigner?.value === item.value && executionMethod !== ExecutionMethod.WITH_RELAY) {
    return <SafeFontIcon name="check" color="$color" />
  }

  return (
    toBigInt(item.balance) < totalFee && (
      <Container backgroundColor="$backgroundSecondary" paddingVertical="$1" paddingHorizontal="$3">
        <Text color="$colorSecondary">Not enough gas</Text>
      </Container>
    )
  )
}

export const HowToExecuteSheetContainer = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { txId } = useLocalSearchParams<{
    txId: string
  }>()

  const { setTxSigner } = useTxSignerActions()
  const activeSafe = useDefinedActiveSafe()
  const { data: txDetails, isLoading: isLoadingTxDetails } = useTransactionData(txId)
  const manualParams = useAppSelector(selectEstimatedFee)

  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const activeSigner = useAppSelector((state: RootState) => selectActiveSigner(state, activeSafe.address))
  const executionMethod = useAppSelector(selectExecutionMethod)

  const { items, loading } = useAvailableSigners(txId, ActionType.EXECUTE)
  const { estimatedFeeParams } = useGasFee(txDetails as TransactionDetails, manualParams)
  const totalFee = getTotalFee(estimatedFeeParams.maxFeePerGas ?? 0n, estimatedFeeParams.gasLimit ?? 0n)

  const { data: relaysRemaining, isLoading: isLoadingRelays } = useRelayGetRelaysRemainingV1Query({
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
  })

  const handleExecutionMethodSelect = (selectedMethod: ExecutionMethod, signer?: SignerInfo) => {
    if (signer && activeSigner?.value !== signer.value) {
      setTxSigner(signer)
    }

    // Persist execution method to Redux store
    dispatch(setExecutionMethod(selectedMethod))

    router.dismissTo({
      pathname: '/review-and-execute',
      params: { txId },
    })
  }

  const isRelayAvailable = relaysRemaining?.remaining && relaysRemaining.remaining > 0
  const isRelayEnabled = hasFeature(activeChain, FEATURES.RELAYING)

  return (
    <SafeBottomSheet title="Choose how to execute" snapPoints={['90%']} loading={loading || isLoadingTxDetails}>
      <ScrollView>
        <View gap="$3" paddingHorizontal="$1">
          {/* Relayer Option */}
          {isRelayEnabled && (
            <>
              <Container
                spaced={false}
                backgroundColor={
                  executionMethod === ExecutionMethod.WITH_RELAY ? '$backgroundSecondary' : 'transparent'
                }
                borderWidth={executionMethod === ExecutionMethod.WITH_RELAY ? 0 : 1}
                borderColor={executionMethod !== ExecutionMethod.WITH_RELAY ? '$borderLight' : undefined}
                paddingVertical="$3"
                paddingHorizontal="$4"
                gap="$1"
                onPress={() => isRelayAvailable && handleExecutionMethodSelect(ExecutionMethod.WITH_RELAY)}
              >
                {isRelayAvailable ? (
                  <RelayAvailable
                    isLoadingRelays={isLoadingRelays}
                    relaysRemaining={relaysRemaining}
                    executionMethod={executionMethod}
                  />
                ) : (
                  <RelayUnavailable />
                )}
              </Container>

              {/* Divider Text */}
              <Text fontWeight="600" fontSize="$4" paddingHorizontal="$1" marginTop="$2">
                Or use your signer:
              </Text>
            </>
          )}

          {/* Signers List */}
          <View gap="$2">
            {items.map((item) => {
              return (
                <View
                  key={item.value}
                  width="100%"
                  borderRadius={'$4'}
                  backgroundColor={
                    executionMethod === ExecutionMethod.WITH_PK && activeSigner?.value === item.value
                      ? '$backgroundSecondary'
                      : 'transparent'
                  }
                >
                  <SignersCard
                    transparent
                    onPress={() => handleExecutionMethodSelect(ExecutionMethod.WITH_PK, item)}
                    name={<ContactDisplayNameContainer address={item.value as Address} />}
                    address={item.value as Address}
                    balance={`${item.balance ? formatVisualAmount(item.balance, activeChain.nativeCurrency.decimals) : '0'} ${
                      activeChain.nativeCurrency.symbol
                    }`}
                    rightNode={getActiveSignerRightNode(totalFee, item, executionMethod, activeSigner)}
                  />
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </SafeBottomSheet>
  )
}


import { Text, View } from 'tamagui'
import React from 'react'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useGasFee from "@/src/features/ExecuteTx/hooks/useGasFee"
import { TransactionDetails } from "@safe-global/store/gateway/AUTO_GENERATED/transactions"
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'

import { SafeInput } from '@/src/components/SafeInput'
import { SafeButton } from '@/src/components/SafeButton'

interface ChangeEstimatedFeeFormProps {
    txDetails: TransactionDetails
}

export const ChangeEstimatedFeeForm = ({ txDetails }: ChangeEstimatedFeeFormProps) => {
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const activeSafe = useDefinedActiveSafe()
    const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

    const [maxFeeGwei, setMaxFeeGwei] = React.useState<string>('25')
    const [gasLimit, setGasLimit] = React.useState<string>('21000')
    const [nonce, setNonce] = React.useState<string>('85')

    const nativeSymbol = activeChain?.nativeCurrency?.symbol || 'ETH'


    // TODO: change it to use the estimated fee from the tx
    const onCancel = () => router.back()
    const onConfirm = () => {
        // TODO: wire into tx params update when available
        router.back()
    }

    // number pad doesn't appears on simulator
    const sanitizeDigits = React.useCallback((value: string) => value.replace(/\D+/g, ''), [])
    const totalFee = useGasFee(txDetails)

    return (
        <View width="100%" gap="$3">
            <View>
                <Text color="$colorSecondary" fontSize="$5" marginBottom="$3">Max. fee (gwei)</Text>
                <SafeInput
                    value={maxFeeGwei}
                    onChangeText={(t) => setMaxFeeGwei(sanitizeDigits(t))}
                    keyboardType="number-pad"
                    testID="input-max-fee-gwei"
                />
            </View>

            <View>
                <Text color="$colorSecondary" fontSize="$5" marginBottom="$3">Gas limit</Text>
                <SafeInput
                    value={gasLimit}
                    onChangeText={(t) => setGasLimit(sanitizeDigits(t))}
                    keyboardType="number-pad"
                    testID="input-gas-limit"
                />
            </View>

            <View>
                <Text color="$colorSecondary" fontSize="$5" marginBottom="$3">Nonce</Text>
                <SafeInput
                    value={nonce}
                    onChangeText={(t) => setNonce(sanitizeDigits(t))}
                    keyboardType="number-pad"
                    testID="input-nonce"
                />
            </View>

            <View
                marginTop="$1"
                backgroundColor="$background"
                borderRadius="$4"
                padding="$5"
                alignItems="center"
                justifyContent="space-between"
                flexDirection="row"
            >
                <Text color="$colorSecondary" fontSize="$5">Est. network fee</Text>
                <Text fontWeight={700} fontSize="$5">{totalFee} {nativeSymbol}</Text>
            </View>

            <View
                paddingTop="$3"
                paddingBottom={insets.bottom ? insets.bottom : '$2'}
                flexDirection="row"
                gap="$2"
            >
                <SafeButton outlined flex={1} onPress={onCancel}>
                    Cancel
                </SafeButton>
                <SafeButton flex={1} primary onPress={onConfirm}>
                    Confirm
                </SafeButton>
            </View>
        </View>
    )
}
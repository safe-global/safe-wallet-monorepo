import React, { useMemo } from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack, Text, H3 } from 'tamagui'
import { Logo } from '@/src/components/Logo'
import { TransactionHeader } from '../../TransactionHeader'
import {
  MultisigExecutionDetails,
  TransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTokenDetails } from '@/src/hooks/useTokenDetails'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById, selectActiveChainCurrency } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Address } from '@/src/types/address'
import { TokenAmount } from '@/src/components/TokenAmount'
import { ParametersButton } from '@/src/components/ParametersButton'
import { HashDisplay } from '@/src/components/HashDisplay'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { buildFeesBreakdown } from '@/src/features/ConfirmTx/components/TransactionInfo/feeRows'
import { isERC20Transfer } from '@/src/utils/transaction-guards'

interface TokenTransferProps {
  txId: string
  txInfo: TransferTransactionInfo
  executionInfo: MultisigExecutionDetails
  executedAt: number
}

export function TokenTransfer({ txId, txInfo, executionInfo, executedAt }: TokenTransferProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const nativeCurrency = useAppSelector(selectActiveChainCurrency)
  const { value, tokenSymbol, logoUri, decimals } = useTokenDetails(txInfo)

  const recipientAddress = txInfo.recipient.value as Address

  const safePaidFee = useMemo(() => {
    if (!nativeCurrency) {
      return undefined
    }
    const breakdown = buildFeesBreakdown({
      detailedExecutionInfo: executionInfo,
      nativeCurrency: { address: ZERO_ADDRESS, symbol: nativeCurrency.symbol, decimals: nativeCurrency.decimals },
    })
    const transferTokenAddress = isERC20Transfer(txInfo.transferInfo) ? txInfo.transferInfo.tokenAddress : ZERO_ADDRESS
    if (!breakdown.paidFromSafe || sameAddress(breakdown.maxGasFee.address, transferTokenAddress)) {
      return undefined
    }
    return breakdown.maxGasFee
  }, [executionInfo, nativeCurrency, txInfo])

  return (
    <>
      <TransactionHeader
        logo={logoUri}
        badgeIcon="transaction-outgoing"
        badgeThemeName="badge_error"
        badgeColor="$error"
        title={
          <YStack alignItems="center" gap="$1">
            <Text color="$textSecondaryLight" fontSize="$4">
              Sending
            </Text>
            <H3 fontWeight={600} textAlign="center" paddingHorizontal="$4">
              <TokenAmount
                value={value}
                decimals={decimals}
                tokenSymbol={tokenSymbol}
                direction={txInfo.direction}
                preciseAmount
              />
            </H3>
            {safePaidFee && (
              <H3 fontWeight={600} textAlign="center" paddingHorizontal="$4">
                <TokenAmount
                  value={safePaidFee.amount}
                  decimals={safePaidFee.decimals}
                  tokenSymbol={safePaidFee.symbol}
                  direction={txInfo.direction}
                  preciseAmount
                />
              </H3>
            )}
          </YStack>
        }
        submittedAt={executionInfo?.submittedAt || executedAt}
      />

      <View>
        <YStack gap="$4" marginTop="$8">
          <Container padding="$4" gap="$4" borderRadius="$3">
            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">To</Text>

              <View flexDirection="row" alignItems="center" gap="$2">
                <HashDisplay value={recipientAddress} />
              </View>
            </View>

            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">Network</Text>

              <View flexDirection="row" alignItems="center" gap="$2">
                <Logo logoUri={activeChain?.chainLogoUri} size="$6" />
                <Text fontSize="$4">{activeChain?.chainName}</Text>
              </View>
            </View>

            <ParametersButton txId={txId} />
          </Container>
        </YStack>
      </View>
    </>
  )
}

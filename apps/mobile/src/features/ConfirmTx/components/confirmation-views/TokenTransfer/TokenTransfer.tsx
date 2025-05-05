import React from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack, Text, Button, H3 } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Logo } from '@/src/components/Logo'
import { EthAddress } from '@/src/components/EthAddress'
import { Identicon } from '@/src/components/Identicon'
import { TransactionHeader } from '../../TransactionHeader'
import {
  MultisigExecutionDetails,
  TransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTokenDetails } from '@/src/hooks/useTokenDetails'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Address } from '@/src/types/address'
import { TokenAmount } from '@/src/components/TokenAmount'
import { useOpenExplorer } from '@/src/features/ConfirmTx/hooks/useOpenExplorer'
interface TokenTransferProps {
  txInfo: TransferTransactionInfo
  executionInfo: MultisigExecutionDetails
  executedAt: number
}

export function TokenTransfer({ txInfo, executionInfo, executedAt }: TokenTransferProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const { value, tokenSymbol, logoUri, decimals } = useTokenDetails(txInfo)

  const recipientAddress = txInfo.recipient.value as Address

  const viewOnExplorer = useOpenExplorer(recipientAddress)

  return (
    <>
      <TransactionHeader
        logo={logoUri}
        badgeIcon="transaction-outgoing"
        badgeThemeName="badge_error"
        badgeColor="$error"
        title={
          <H3 fontWeight={600}>
            <TokenAmount
              value={value}
              decimals={decimals}
              tokenSymbol={tokenSymbol}
              direction={txInfo.direction}
              preciseAmount
            />
          </H3>
        }
        submittedAt={executionInfo?.submittedAt || executedAt}
      />

      <View>
        <YStack gap="$4" marginTop="$8">
          <Container padding="$4" gap="$4" borderRadius="$3">
            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">To</Text>

              <View flexDirection="row" alignItems="center">
                <View flexDirection="row" alignItems="center" gap="$2">
                  <Identicon address={recipientAddress} size={24} />
                  <EthAddress
                    address={recipientAddress}
                    copy
                    copyProps={{ color: '$textSecondaryLight', size: 18 }}
                    textProps={{ fontSize: '$4' }}
                  />
                </View>
                <Button
                  onPress={viewOnExplorer}
                  height={18}
                  style={{ marginLeft: -12 }}
                  pressStyle={{ backgroundColor: 'transparent' }}
                >
                  <SafeFontIcon name="external-link" color="$textSecondaryLight" size={16} />
                </Button>
              </View>
            </View>

            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">Network</Text>

              <View flexDirection="row" alignItems="center" gap="$2">
                <Logo logoUri={activeChain?.chainLogoUri} size="$6" />
                <Text fontSize="$4">{activeChain?.chainName}</Text>
              </View>
            </View>
          </Container>
        </YStack>
      </View>
    </>
  )
}

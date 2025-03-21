import React from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack, Text, Button } from 'tamagui'
import Share from 'react-native-share'
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
import Logger from '@/src/utils/logger'
interface TokenTransferProps {
  txInfo: TransferTransactionInfo
  executionInfo: MultisigExecutionDetails
  executedAt: number
}

export function TokenTransfer({ txInfo, executionInfo, executedAt }: TokenTransferProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const { value, tokenSymbol, logoUri } = useTokenDetails(txInfo)

  const recipientAddress = txInfo.recipient.value as Address

  const onPressShare = async () => {
    Share.open({
      title: 'Recipient address',
      message: recipientAddress,
      type: 'text/plain',
    }).then((res) => {
      Logger.info(res.message)
    })
  }

  return (
    <>
      <TransactionHeader
        logo={logoUri}
        badgeIcon="transaction-outgoing"
        badgeThemeName="badge_error"
        badgeColor="$error"
        title={`-${value} ${tokenSymbol}`}
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
                  onPress={() => {
                    onPressShare()
                  }}
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

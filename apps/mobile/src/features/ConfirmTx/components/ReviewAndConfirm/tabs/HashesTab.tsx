import React, { useMemo } from 'react'
import { Tabs } from 'react-native-collapsible-tab-view'
import { View, Text } from 'tamagui'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeVersion, SafeTransactionData } from '@safe-global/types-kit'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import extractTxInfo from '@/src/services/tx/extractTx'
import { getDomainHash, getSafeTxMessageHash } from '@safe-global/utils/utils/safe-hashes'

interface HashesTabProps {
  txDetails: TransactionDetails
}

export const HashesTab = ({ txDetails }: HashesTabProps) => {
  const { safe, safeAddress } = useSafeInfo()

  const { domainHash, messageHash, safeTxHash } = useMemo(() => {
    try {
      if (!safe.version || !safeAddress) {
        return { domainHash: null, messageHash: null, safeTxHash: null }
      }
      const { txParams } = extractTxInfo(txDetails, safeAddress)
      const dh = getDomainHash({ chainId: safe.chainId, safeAddress, safeVersion: safe.version as SafeVersion })
      const mh = getSafeTxMessageHash({
        safeVersion: safe.version as SafeVersion,
        safeTxData: txParams as SafeTransactionData,
      })
      const sth = calculateSafeTransactionHash(
        safeAddress,
        txParams as SafeTransactionData,
        safe.version,
        BigInt(safe.chainId),
      )
      return { domainHash: dh, messageHash: mh, safeTxHash: sth }
    } catch {
      return { domainHash: null, messageHash: null, safeTxHash: null }
    }
  }, [safe.version, safe.chainId, safeAddress, txDetails])

  return (
    <Tabs.ScrollView contentContainerStyle={{ padding: 16 }}>
      <View gap="$3">
        <View>
          <Text fontSize="$3" color="$colorSecondary">
            Domain hash
          </Text>
          <Text fontSize="$5" color="$color">
            {domainHash ?? '—'}
          </Text>
        </View>
        <View>
          <Text fontSize="$3" color="$colorSecondary">
            Message hash
          </Text>
          <Text fontSize="$5" color="$color">
            {messageHash ?? '—'}
          </Text>
        </View>
        <View>
          <Text fontSize="$3" color="$colorSecondary">
            safeTxHash
          </Text>
          <Text fontSize="$5" color="$color">
            {safeTxHash ?? '—'}
          </Text>
        </View>
      </View>
    </Tabs.ScrollView>
  )
}

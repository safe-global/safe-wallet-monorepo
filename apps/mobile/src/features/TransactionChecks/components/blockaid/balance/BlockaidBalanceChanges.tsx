import React from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { BlockaidModuleResponse } from '@safe-global/utils/services/security/modules/BlockaidModule'
import { CircleSnail } from 'react-native-progress'
import { InfoSheet } from '@/src/components/InfoSheet'
import { PoweredByBlockaid } from '../PoweredByBlockaid'
import { BalanceChange } from '@/src/features/TransactionChecks/components/blockaid/balance/BalanceChange'

type BlockaidBalanceChangesProps = {
  blockaidResponse?: {
    severity?: number
    isLoading?: boolean
    error?: Error
    payload?: BlockaidModuleResponse
  }
  fetchStatusLoading?: boolean
}

const BalanceChanges = ({ blockaidResponse }: BlockaidBalanceChangesProps) => {
  const { isLoading, error, payload } = blockaidResponse ?? {}

  const totalBalanceChanges = payload?.balanceChange
    ? payload.balanceChange.reduce((prev, current) => prev + current.in.length + current.out.length, 0)
    : 0

  if (isLoading) {
    return (
      <XStack gap="$2" alignItems="center">
        <CircleSnail size={16} borderWidth={0} thickness={1} />
        <Text fontSize={14} color="$textSecondary">
          Calculating...
        </Text>
      </XStack>
    )
  }
  if (error) {
    return (
      <Text fontSize={14} color="$textSecondary">
        Could not calculate balance changes.
      </Text>
    )
  }
  if (totalBalanceChanges === 0) {
    return (
      <Text fontSize={14} color="$textSecondary">
        No balance change detected
      </Text>
    )
  }

  return (
    <YStack>
      {payload?.balanceChange?.map((change, assetIdx) => (
        <React.Fragment key={assetIdx}>
          {change.in.map((diff, changeIdx) => (
            <BalanceChange key={`${assetIdx}-in-${changeIdx}`} asset={change.asset} positive diff={diff} />
          ))}
          {change.out.map((diff, changeIdx) => (
            <BalanceChange key={`${assetIdx}-out-${changeIdx}`} asset={change.asset} diff={diff} />
          ))}
        </React.Fragment>
      ))}
    </YStack>
  )
}

export const BlockaidBalanceChanges = ({ blockaidResponse, fetchStatusLoading }: BlockaidBalanceChangesProps) => {
  return (
    <YStack>
      <XStack gap="$2">
        <Text fontWeight="700" marginBottom="$2">
          Balance change
        </Text>
        <InfoSheet info="The balance change gives an overview of the implications of a transaction. You can see which assets will be sent and received after the transaction is executed." />
      </XStack>
      {fetchStatusLoading ? (
        <XStack gap={'$2'}>
          <CircleSnail size={16} borderWidth={0} thickness={1} />
          <Text>Checking balance with Blockaid...</Text>
        </XStack>
      ) : (
        <>
          <BalanceChanges blockaidResponse={blockaidResponse} />
          <PoweredByBlockaid />
        </>
      )}
    </YStack>
  )
}

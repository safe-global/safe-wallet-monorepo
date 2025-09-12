import React from 'react'
import { Text, View } from 'tamagui'
import { Container } from '@/src/components/Container'
import { formatWithSchema } from '@/src/utils/date'
import { HashDisplay } from '@/src/components/HashDisplay'
import { Badge } from '@/src/components/Badge'
import { PendingTx } from '@/src/store/pendingTxsSlice'

export const PendingTxInfo = ({ createdAt, pendingTx }: { createdAt: number | null; pendingTx: PendingTx }) => {
  return (
    <Container padding="$4" gap="$4" borderRadius="$3">
      {createdAt && (
        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Created</Text>
          <Text fontSize="$4" color="$textPrimary">
            {formatWithSchema(createdAt, 'd MMM yyyy, HH:mm a')}
          </Text>
        </View>
      )}

      {pendingTx?.txHash && (
        <View alignItems="center" flexDirection="row" justifyContent="space-between">
          <Text color="$textSecondaryLight">Transaction hash</Text>
          <HashDisplay value={pendingTx.txHash} showVisualIdentifier={false} />
        </View>
      )}

      <View alignItems="center" flexDirection="row" justifyContent="space-between">
        <Text color="$textSecondaryLight">Status</Text>
        <Badge
          themeName="badge_success_variant1"
          circular={false}
          content={pendingTx?.status !== 'SUCCESS' ? 'Executing' : 'Success'}
          fontSize={13}
          circleProps={{ paddingHorizontal: 8, paddingVertical: 2 }}
        />
      </View>
    </Container>
  )
}

import React from 'react'
import { Text, View, YStack } from 'tamagui'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { TokenAmount } from '@/src/components/TokenAmount'
import type { FeeLine } from './feeRows'

/**
 * Shared fee row: label on the left, value(s) right-aligned, content centered within a 40px row.
 * Used by every fee surface (breakdown, execute footer) so the visual contract stays consistent.
 */
export const FeeRow = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <View flexDirection="row" justifyContent="space-between" alignItems="center" gap="$2" minHeight="$10">
    <View flex={1}>{label}</View>
    <YStack alignItems="flex-end" flexShrink={0}>
      {children}
    </YStack>
  </View>
)

/** Token amount (secondary color) with its fiat value on a mini line below (no parentheses). */
export const FeeAmount = ({ line, fiat, currency }: { line: FeeLine; fiat?: number; currency: string }) => (
  <>
    <TokenAmount
      value={line.amount}
      decimals={line.decimals}
      tokenSymbol={line.symbol}
      textProps={{ fontSize: '$4', color: '$textSecondaryLight' }}
    />
    {fiat !== undefined && (
      <Text color="$textSecondaryLight" fontSize="$3" lineHeight={16}>
        {formatCurrency(fiat, currency)}
      </Text>
    )}
  </>
)

/** The "FREE" execution-fee value, styled consistently across fee surfaces. */
export const FeeFreeValue = () => (
  <Text fontSize="$4" color="$success">
    FREE
  </Text>
)

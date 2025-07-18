import React from 'react'
import { View } from 'tamagui'
import { useColorScheme } from 'react-native'
import { Skeleton } from 'moti/skeleton'
import { Container } from '@/src/components/Container'
import random from 'lodash/random'

interface TxHistorySkeletonProps {
  count?: number
}

export const TxHistorySkeletonItem = () => {
  const colorScheme = useColorScheme() || undefined

  return (
    <Container spaced paddingVertical="$5" bordered={false}>
      <View flexDirection="row" width="100%" alignItems="center" justifyContent="space-between">
        <View flexDirection="row" maxWidth="55%" alignItems="center" gap="$3">
          {/* Left icon skeleton */}
          <Skeleton colorMode={colorScheme} radius="round" height={32} width={32} />

          <View flex={1} gap="$2">
            {/* Transaction type skeleton */}
            <Skeleton colorMode={colorScheme} height={10} width={random(60, 100)} />

            {/* Transaction label skeleton */}
            <Skeleton colorMode={colorScheme} height={18} width={random(60, 180)} />
          </View>
        </View>

        {/* Right side skeleton */}
        <View alignItems="flex-end" gap="$2">
          <Skeleton colorMode={colorScheme} height={16} width={random(60, 100)} />
        </View>
      </View>
    </Container>
  )
}

export const TxHistorySkeleton = ({ count = 6 }: TxHistorySkeletonProps) => {
  const colorScheme = useColorScheme() || undefined

  return (
    <Skeleton.Group show={true}>
      <View gap="$4">
        {/* Date header skeleton */}
        <View>
          <Skeleton colorMode={colorScheme} height={20} width={100} />
        </View>

        {/* Transaction items skeleton */}
        {Array.from({ length: count }).map((_, index) => (
          <TxHistorySkeletonItem key={index} />
        ))}
      </View>
    </Skeleton.Group>
  )
}

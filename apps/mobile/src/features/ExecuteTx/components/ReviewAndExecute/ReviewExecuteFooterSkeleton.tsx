import React from 'react'
import { View } from 'tamagui'
import { SafeSkeleton } from '@/src/components/SafeSkeleton'
import { Container } from '@/src/components/Container'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function ReviewExecuteFooterSkeleton() {
  const insets = useSafeAreaInsets()

  return (
    <SafeSkeleton.Group show={true}>
      <View paddingHorizontal="$4" gap="$3" paddingBottom={insets.bottom ? insets.bottom : '$4'}>
        <Container
          backgroundColor="transparent"
          gap={'$2'}
          borderWidth={1}
          paddingVertical={'$3'}
          borderColor="$borderLight"
        >
          {/* EstimatedNetworkFee skeleton */}
          <View flexDirection="row" alignItems="center" justifyContent="space-between" paddingHorizontal="$4">
            <View gap="$2">
              <SafeSkeleton height={14} width={100} />
              <SafeSkeleton height={12} width={140} />
            </View>
            <View alignItems="flex-end" gap="$2">
              <SafeSkeleton height={16} width={60} />
              <SafeSkeleton height={12} width={80} />
            </View>
          </View>
        </Container>

        {/* Button skeleton */}
        <SafeSkeleton height={48} width="100%" radius={12} />
      </View>
    </SafeSkeleton.Group>
  )
}

import React from 'react'
import { Stack, View } from 'tamagui'
import { Skeleton } from 'moti/skeleton'
import { Container } from '@/src/components/Container'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/src/theme/hooks/useTheme'

export function ReviewExecuteFooterSkeleton() {
  const insets = useSafeAreaInsets()
  const { colorScheme } = useTheme()

  return (
    <Skeleton.Group show={true}>
      <Stack paddingHorizontal="$4" space="$3" paddingBottom={insets.bottom ? insets.bottom : '$4'}>
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
              <Skeleton colorMode={colorScheme} height={14} width={100} />
              <Skeleton colorMode={colorScheme} height={12} width={140} />
            </View>
            <View alignItems="flex-end" gap="$2">
              <Skeleton colorMode={colorScheme} height={16} width={60} />
              <Skeleton colorMode={colorScheme} height={12} width={80} />
            </View>
          </View>
        </Container>

        {/* Button skeleton */}
        <Skeleton colorMode={colorScheme} height={48} width="100%" radius={12} />
      </Stack>
    </Skeleton.Group>
  )
}

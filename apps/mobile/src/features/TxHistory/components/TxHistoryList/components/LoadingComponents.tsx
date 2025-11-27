import React from 'react'
import { View, Text } from 'tamagui'
import { TransactionSkeleton, TransactionSkeletonItem } from '@/src/components/TransactionSkeleton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

const EmptyComponentBase = () => (
  <View flex={1} alignItems="flex-start" justifyContent="flex-start" paddingTop="$4" testID="tx-history-initial-loader">
    <TransactionSkeleton count={6} sectionTitles={['Recent transactions']} />
  </View>
)

export const EmptyComponent = React.memo(EmptyComponentBase)
EmptyComponent.displayName = 'EmptyComponent'

const HeaderComponentBase = () => (
  <View testID="tx-history-previous-loader" marginBottom="$4">
    <TransactionSkeletonItem />
  </View>
)

export const HeaderComponent = React.memo(HeaderComponentBase)
HeaderComponent.displayName = 'HeaderComponent'

const FooterComponentBase = () => (
  <View testID="tx-history-next-loader" marginTop="$4">
    <TransactionSkeletonItem />
  </View>
)

export const FooterComponent = React.memo(FooterComponentBase)
FooterComponent.displayName = 'FooterComponent'

const ErrorComponentBase = () => (
  <View
    flex={1}
    alignItems="center"
    justifyContent="center"
    paddingTop="$8"
    paddingHorizontal="$4"
    testID="tx-history-error"
  >
    <SafeFontIcon name="info" size={48} color="$colorSecondary" />
    <Text fontSize="$5" fontWeight="600" marginTop="$4" textAlign="center">
      Error fetching transactions
    </Text>
    <Text fontSize="$3" color="$colorSecondary" marginTop="$2" textAlign="center">
      Swipe down to retry
    </Text>
  </View>
)

export const ErrorComponent = React.memo(ErrorComponentBase)
ErrorComponent.displayName = 'ErrorComponent'

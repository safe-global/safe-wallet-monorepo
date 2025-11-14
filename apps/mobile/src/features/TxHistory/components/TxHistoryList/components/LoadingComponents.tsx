import React from 'react'
import { View } from 'tamagui'
import { TransactionSkeleton, TransactionSkeletonItem } from '@/src/components/TransactionSkeleton'

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

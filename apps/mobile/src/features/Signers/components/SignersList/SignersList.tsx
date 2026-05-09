import React, { useMemo } from 'react'
import { Loader } from '@/src/components/Loader'
import { FlatList } from 'react-native'
import { useCallback } from 'react'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { SignersListHeader } from './SignersListHeader'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import SignersListItem from './SignersListItem'

export type SignerSection = {
  id: string
  title: string
  data: SafeState['owners']
}

const keyExtractor = (item: AddressInfo, index: number) => item.value + index

interface SignersListProps {
  signersGroup: SignerSection[]
  isFetching: boolean
  hasLocalSigners: boolean
  navbarTitle?: string
}

export function SignersList({ signersGroup, isFetching, hasLocalSigners, navbarTitle }: SignersListProps) {
  const title = navbarTitle || 'Your signers'
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle>{title}</NavBarTitle>,
  })

  const flatData = useMemo(() => signersGroup.flatMap((section) => section.data), [signersGroup])

  const renderItem = useCallback(
    ({ item }: { item: AddressInfo }) => {
      return <SignersListItem item={item} signersGroup={signersGroup} />
    },
    [signersGroup],
  )

  const ListHeaderComponent = useCallback(
    () => <SignersListHeader sectionTitle={title} withAlert={!hasLocalSigners} />,
    [hasLocalSigners, title],
  )

  return (
    <FlatList<AddressInfo>
      testID="signers-list"
      onScroll={handleScroll}
      ListHeaderComponent={ListHeaderComponent}
      contentInsetAdjustmentBehavior="automatic"
      data={flatData}
      ListFooterComponent={isFetching ? <Loader size={24} color="$color" /> : undefined}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      scrollEventThrottle={16}
    />
  )
}

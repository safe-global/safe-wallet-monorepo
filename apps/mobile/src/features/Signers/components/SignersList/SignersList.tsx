import React from 'react'

import { SafeListItem } from '@/src/components/SafeListItem'
import { Loader } from '@/src/components/Loader'
import { SectionList } from 'react-native'
import { useCallback } from 'react'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import { NavBarTitle } from '@/src/components/Title'
import { SignersListHeader } from './SignersListHeader'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import SignersListItem from './SignersListItem'

export type SignerSection = {
  title: string
  data: SafeState['owners']
}

const keyExtractor = (item: AddressInfo, index: number) => item.value + index

interface SignersListProps {
  signersGroup: SignerSection[]
  isFetching: boolean
  hasLocalSingers: boolean
  navbarTitle?: string
}

export function SignersList({ signersGroup, isFetching, hasLocalSingers, navbarTitle }: SignersListProps) {
  const title = navbarTitle || 'Signers'
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle>{title}</NavBarTitle>,
  })

  const renderItem = useCallback(
    ({ item, index }: { item: AddressInfo; index: number }) => {
      return <SignersListItem item={item} index={index} signersGroup={signersGroup} />
    },
    [signersGroup],
  )

  const ListHeaderComponent = useCallback(
    () => <SignersListHeader sectionTitle={title} withAlert={!hasLocalSingers} />,
    [hasLocalSingers],
  )

  return (
    <SectionList<AddressInfo, SignerSection>
      testID="tx-history-list"
      onScroll={handleScroll}
      ListHeaderComponent={ListHeaderComponent}
      stickySectionHeadersEnabled
      contentInsetAdjustmentBehavior="automatic"
      sections={signersGroup}
      ListFooterComponent={isFetching ? <Loader size={24} color="$color" /> : undefined}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      scrollEventThrottle={16}
      renderSectionHeader={({ section: { title } }) => <SafeListItem.Header title={title} />}
    />
  )
}

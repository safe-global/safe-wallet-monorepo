import React, { useMemo } from 'react'

import { SafeListItem } from '@/src/components/SafeListItem'
import { getTokenValue, Spinner } from 'tamagui'

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
}

export function SignersList({ signersGroup, isFetching, hasLocalSingers }: SignersListProps) {
  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle>Signers</NavBarTitle>,
  })

  const renderItem = useCallback(
    ({ item, index }: { item: AddressInfo; index: number }) => {
      return <SignersListItem item={item} index={index} signersGroup={signersGroup} />
    },
    [signersGroup],
  )

  const ListHeaderComponent = useCallback(() => <SignersListHeader withAlert={!hasLocalSingers} />, [hasLocalSingers])
  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: getTokenValue('$3'),
    }),
    [],
  )

  return (
    <SectionList<AddressInfo, SignerSection>
      testID="tx-history-list"
      onScroll={handleScroll}
      ListHeaderComponent={ListHeaderComponent}
      stickySectionHeadersEnabled
      contentInsetAdjustmentBehavior="automatic"
      sections={signersGroup}
      ListFooterComponent={isFetching ? <Spinner size="small" color="$color" /> : undefined}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      scrollEventThrottle={16}
      contentContainerStyle={contentContainerStyle}
      renderSectionHeader={({ section: { title } }) => <SafeListItem.Header title={title} />}
    />
  )
}

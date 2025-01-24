import React from 'react'
import { RenderItemParams } from 'react-native-draggable-flatlist'
import { AccountItem } from '../AccountItem'
import { SafesSliceItem } from '@/src/store/safesSlice'
import { Address } from '@/src/types/address'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveSafe, setActiveSafe } from '@/src/store/activeSafeSlice'
import { getChainsByIds } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { useMyAccounts } from './hooks/useMyAccounts'

interface MyAccountsContainerProps {
  item: SafesSliceItem
  onClose: () => void
  isDragging?: boolean
  drag?: RenderItemParams<SafesSliceItem>['drag']
}

export function MyAccountsContainer({ item, isDragging, drag, onClose }: MyAccountsContainerProps) {
  useMyAccounts(item)

  const dispatch = useDispatch()
  const activeSafe = useSelector(selectActiveSafe)
  const filteredChains = useSelector((state: RootState) => getChainsByIds(state, item.chains))

  const handleAccountSelected = () => {
    const chainId = item.chains[0]

    dispatch(
      setActiveSafe({
        address: item.SafeInfo.address.value as Address,
        chainId,
      }),
    )

    onClose()
  }

  return (
    <AccountItem
      drag={drag}
      account={item.SafeInfo}
      isDragging={isDragging}
      chains={filteredChains}
      onSelect={handleAccountSelected}
      activeAccount={activeSafe.address}
    />
  )
}

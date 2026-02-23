import React from 'react'
import { RenderItemParams } from 'react-native-draggable-flatlist'
import { AccountItem } from '../AccountItem'
import { SafesSliceItem } from '@/src/store/safesSlice'
import { Address } from '@/src/types/address'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { getChainsByIds } from '@/src/store/chains'
import { RootState } from '@/src/store'
import { useSafeOverviewService } from '@/src/hooks/services/useSafeOverviewService'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

interface MyAccountsContainerProps {
  item: { address: Address; info: SafesSliceItem }
  onClose: () => void
  isDragging?: boolean
  drag?: RenderItemParams<{ address: Address; info: SafesSliceItem }>['drag']
}

export function MyAccountsContainer({ item, isDragging, drag, onClose }: MyAccountsContainerProps) {
  useSafeOverviewService(item.address)

  const dispatch = useDispatch()
  const activeSafe = useDefinedActiveSafe()
  const chainsIds = Object.keys(item.info)
  const filteredChains = useSelector((state: RootState) => getChainsByIds(state, chainsIds))

  const handleAccountSelected = () => {
    const chainId = chainsIds[0]

    dispatch(
      setActiveSafe({
        address: item.address,
        chainId,
      }),
    )

    onClose()
  }

  return (
    <AccountItem
      drag={drag}
      account={{
        ...item.info[chainsIds[0]],
        fiatTotal: chainsIds.reduce((acc, id) => acc + parseFloat(item.info[id].fiatTotal), 0).toString(),
      }}
      isDragging={isDragging}
      chains={filteredChains}
      onSelect={handleAccountSelected}
      activeAccount={activeSafe.address}
    />
  )
}

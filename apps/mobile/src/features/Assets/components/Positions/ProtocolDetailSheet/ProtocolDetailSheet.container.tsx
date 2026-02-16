import React, { useCallback, useMemo, useRef } from 'react'
import { Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getTokenValue, getVariable, useTheme } from 'tamagui'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { ProtocolDetailSheetHeader } from './ProtocolDetailSheetHeader'
import { ProtocolDetailSheetPositions } from './ProtocolDetailSheet'
import { usePositions } from '@/src/features/Assets/hooks/usePositions'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import { calculatePositionsFiatTotal, calculateProtocolPercentage } from '@safe-global/utils/features/positions'

export const ProtocolDetailSheetContainer = () => {
  const { protocolId } = useLocalSearchParams<{ protocolId: string }>()
  const currency = useAppSelector(selectCurrency)
  const { data } = usePositions()
  const ref = useRef<BottomSheet>(null)
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  const totalFiatValue = useMemo(() => calculatePositionsFiatTotal(data), [data])
  const protocol = useMemo(() => data?.find((p) => p.protocol === protocolId), [data, protocolId])

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      router.back()
    }
  }, [])

  if (!protocol) {
    return null
  }

  const percentageRatio = calculateProtocolPercentage(protocol.fiatTotal, totalFiatValue)

  return (
    <BottomSheet
      ref={ref}
      enableOverDrag={false}
      snapPoints={[600, '100%']}
      enableDynamicSizing={true}
      onChange={handleSheetChanges}
      enablePanDownToClose
      overDragResistanceFactor={10}
      backgroundComponent={BackgroundComponent}
      backdropComponent={() => <BackdropComponent shouldNavigateBack={Platform.OS === 'ios'} />}
      topInset={insets.top}
      handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
    >
      <BottomSheetScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={{
          paddingBottom: insets.bottom + getTokenValue(Platform.OS === 'ios' ? '$4' : '$8'),
        }}
      >
        <ProtocolDetailSheetHeader protocol={protocol} percentageRatio={percentageRatio} currency={currency} />
        <ProtocolDetailSheetPositions protocol={protocol} currency={currency} />
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

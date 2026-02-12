import React, { useMemo } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { SafeBottomSheet } from '@/src/components/SafeBottomSheet'
import { ProtocolDetailSheet } from './ProtocolDetailSheet'
import { usePositions } from '@/src/features/Assets/hooks/usePositions'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import { calculatePositionsFiatTotal, calculateProtocolPercentage } from '@safe-global/utils/features/positions'

export const ProtocolDetailSheetContainer = () => {
  const { protocolId } = useLocalSearchParams<{ protocolId: string }>()
  const currency = useAppSelector(selectCurrency)
  const { data } = usePositions()

  const totalFiatValue = useMemo(() => calculatePositionsFiatTotal(data), [data])

  const protocol = useMemo(() => data?.find((p) => p.protocol === protocolId), [data, protocolId])

  if (!protocol) {
    return null
  }

  const percentageRatio = calculateProtocolPercentage(protocol.fiatTotal, totalFiatValue)

  return (
    <SafeBottomSheet>
      <ProtocolDetailSheet protocol={protocol} percentageRatio={percentageRatio} currency={currency} />
    </SafeBottomSheet>
  )
}

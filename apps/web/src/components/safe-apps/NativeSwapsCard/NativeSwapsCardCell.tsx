import NativeSwapsCard from './index'
import { useNativeSwapsCard } from './useNativeSwapsCard'
import { NativeSwapsCardCellView } from '@views/components/safe-apps/NativeSwapsCard/NativeSwapsCardView'

// Owns the visibility decision and the `li`, so a hidden card leaves no empty grid cell.
const NativeSwapsCardCell = () => {
  const { isVisible, dismiss } = useNativeSwapsCard()

  if (!isVisible) return null

  return (
    <NativeSwapsCardCellView>
      <NativeSwapsCard onDismiss={dismiss} />
    </NativeSwapsCardCellView>
  )
}

export default NativeSwapsCardCell

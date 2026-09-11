import NativeSwapsCard from './index'
import { useNativeSwapsCard } from './useNativeSwapsCard'

// Owns the visibility decision and the `li`, so a hidden card leaves no empty grid cell.
const NativeSwapsCardCell = () => {
  const { isVisible, dismiss } = useNativeSwapsCard()

  if (!isVisible) return null

  return (
    <li>
      <NativeSwapsCard onDismiss={dismiss} />
    </li>
  )
}

export default NativeSwapsCardCell

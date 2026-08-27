import NativeSwapsCard from './index'
import { useNativeSwapsCard } from './useNativeSwapsCard'

/**
 * The promo card as a list item. Owns both the visibility decision and the `li`
 * wrapper so a dismissed card leaves no empty cell behind in the apps grid.
 */
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

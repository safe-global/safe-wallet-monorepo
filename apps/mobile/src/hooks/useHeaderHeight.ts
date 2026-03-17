import { useRef } from 'react'
import { Platform } from 'react-native'
import { useHeaderHeight as useHeaderHeightElements } from '@react-navigation/elements'

/**
 * Workaround for useHeaderHeight() returning incorrect values on Android
 * with nested navigators. The upstream hook accumulates parent navigator
 * header heights during layout, inflating the value (e.g. 210px instead of 56px).
 *
 * On Android we pin the value from the first render (before the bug inflates it).
 * On iOS the upstream hook works correctly, so we pass through the live value.
 *
 * @see https://github.com/react-navigation/react-navigation/issues/12692
 */
export function useHeaderHeight(): number {
  const headerHeight = useHeaderHeightElements()
  const fixedHeight = useRef(headerHeight)

  return Platform.OS === 'android' ? fixedHeight.current : headerHeight
}

import type { ReactElement } from 'react'

import useLocalStorage from '@/services/local-storage/useLocalStorage'
import madProps from '@/utils/mad-props'
import { DisclaimerWrapperView } from '@views/components/wrappers/DisclaimerWrapper/DisclaimerWrapperView'

// TODO: Use with swaps/staking
export function _DisclaimerWrapper({
  children,
  localStorageKey,
  widgetName,
  getLocalStorage,
}: {
  children: ReactElement
  localStorageKey: string
  widgetName: string
  getLocalStorage: typeof useLocalStorage
}): ReactElement | null {
  const [hasConsented = false, setHasConsented] = getLocalStorage<boolean>(localStorageKey)

  const onAccept = () => {
    setHasConsented(true)
  }

  if (!hasConsented) {
    return <DisclaimerWrapperView widgetName={widgetName} onAccept={onAccept} />
  }

  return children
}

export const DisclaimerWrapper = madProps(_DisclaimerWrapper, {
  getLocalStorage: () => useLocalStorage,
})

import { useEffect } from 'react'

export const useSelectTabOnEnter = (tab: Element | null) => {
  useEffect(() => {
    if (tab instanceof HTMLElement && tab.getAttribute('aria-selected') !== 'true') tab.click()
  }, [tab])
}

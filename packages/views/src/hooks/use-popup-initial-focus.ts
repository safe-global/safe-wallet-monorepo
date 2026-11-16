import * as React from 'react'
import { tabbable, type CheckOptions, type TabbableOptions } from 'tabbable'

// Fields a user types into; a checkbox or a radio button is a control, not a field
const TEXT_FIELD = [
  'input:not([type])',
  'input[type="text"]',
  'input[type="search"]',
  'input[type="email"]',
  'input[type="number"]',
  'input[type="password"]',
  'input[type="tel"]',
  'input[type="url"]',
  'textarea',
  '[contenteditable]:not([contenteditable="false"])',
].join(',')

// A plain button that sets `open` gives no open type; after keyboard use the browser marks it `:focus-visible`
const isOpenedFromKeyboard = (openType: string): boolean => {
  if (openType === 'keyboard') return true
  const opener = document.activeElement
  return opener instanceof HTMLElement && opener !== document.body && opener.matches(':focus-visible')
}

// Base UI's own options, so this finds the same first control as its focus manager
const tabbableOptions = (): CheckOptions & TabbableOptions => ({
  getShadowRoot: true,
  displayCheck:
    typeof ResizeObserver === 'function' && ResizeObserver.toString().includes('[native code]') ? 'full' : 'none',
})

/** Focus target for a popup on open: the first control by keyboard or in a text field, otherwise the popup itself. */
export function usePopupInitialFocus<Element extends HTMLElement, InitialFocus>(
  ref: React.Ref<Element> | undefined,
  initialFocus: InitialFocus | undefined,
) {
  const popupRef = React.useRef<Element | null>(null)

  const mergedRef = React.useCallback(
    (node: Element | null) => {
      popupRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  const focusByOpenType = React.useCallback((openType: string): boolean | HTMLElement | null => {
    const popup = popupRef.current
    if (openType === 'touch') return popup
    if (isOpenedFromKeyboard(openType)) return true
    if (!popup) return null
    const firstControl = tabbable(popup, tabbableOptions())[0]
    return firstControl instanceof HTMLElement && firstControl.matches(TEXT_FIELD) ? firstControl : popup
  }, [])

  return { ref: mergedRef, initialFocus: initialFocus ?? focusByOpenType }
}

import * as React from 'react'
import { tabbable } from 'tabbable'

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

// Base UI knows the open type only for its own triggers; a plain button that sets `open` gives none. The opener
// still has the focus when the popup opens, and the browser marks it `:focus-visible` after keyboard use.
const isOpenedFromKeyboard = (openType: string): boolean => {
  if (openType === 'keyboard') return true
  const opener = document.activeElement
  return opener instanceof HTMLElement && opener !== document.body && opener.matches(':focus-visible')
}

/**
 * Where a dialog, sheet or popover puts the focus when it opens. Opened from the keyboard, through a Base UI
 * trigger or any other control, it keeps Base UI's default, the first control, so a keyboard user can act at once. Opened by pointer or by the app (`open`), it
 * starts in its first control only if that is a text field, so the user can type at once; otherwise it focuses
 * the popup itself, as the tooltip of a first button (a copy button) must not open without a keyboard user.
 * A caller's `initialFocus` still decides, and an `autoFocus` input keeps its focus because Base UI leaves focus
 * that is already inside.
 *
 * @param ref The caller's ref to the popup, if any; it still receives the element.
 * @param initialFocus The caller's `initialFocus`, if any.
 * @returns The `ref` and `initialFocus` props for the Base UI popup.
 */
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
    if (isOpenedFromKeyboard(openType)) return true
    const popup = popupRef.current
    if (!popup) return null
    const firstControl = tabbable(popup)[0]
    return firstControl instanceof HTMLElement && firstControl.matches(TEXT_FIELD) ? firstControl : popup
  }, [])

  return { ref: mergedRef, initialFocus: initialFocus ?? focusByOpenType }
}

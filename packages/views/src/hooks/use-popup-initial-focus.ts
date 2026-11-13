import * as React from 'react'

/**
 * Where a dialog, sheet or popover puts the focus when it opens. Opened from the keyboard, it keeps Base UI's
 * default, the first control, so a keyboard user can act at once. Opened by pointer or by the app (`open`), it
 * focuses the popup itself: the first control's tooltip (a copy button) must not open without a keyboard user.
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

  const focusByOpenType = React.useCallback(
    (openType: string): boolean | Element | null => (openType === 'keyboard' ? true : popupRef.current),
    [],
  )

  return { ref: mergedRef, initialFocus: initialFocus ?? focusByOpenType }
}

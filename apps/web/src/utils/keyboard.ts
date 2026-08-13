import type { KeyboardEvent } from 'react'

/**
 * Makes a non-native `role="button"` element activate like a real button: Enter and Space
 * re-dispatch a click on the element itself, so the existing `onClick` stays the single
 * source of truth. Key presses bubbling up from focusable children are ignored, mirroring
 * native button semantics.
 */
export const clickOnEnterOrSpace = (event: KeyboardEvent<HTMLElement>): void => {
  if (event.target !== event.currentTarget) return

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    event.currentTarget.click()
  }
}

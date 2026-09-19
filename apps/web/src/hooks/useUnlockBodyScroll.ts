import { useEffect } from 'react'

/**
 * Selectors that match an *open* overlay rendered by any of the scroll-locking UI
 * libraries used in the app (MUI, Base UI/shadcn dialogs, Vaul drawers).
 *
 * While at least one of these is present the body is legitimately scroll-locked,
 * so the guard below must not touch it.
 */
const OPEN_OVERLAY_SELECTOR = [
  // MUI modals/dialogs/drawers/popovers/menus. `keepMounted` ones get `.MuiModal-hidden` when closed.
  '.MuiModal-root:not(.MuiModal-hidden)',
  // Base UI / shadcn overlays. Content unmounts while closed EXCEPT under `keepMounted` (e.g. CaptchaModal),
  // where the node stays and is only marked `hidden` — so a bare attribute selector would match a closed
  // overlay and disable the guard for the whole session.
  '[data-slot="dialog-content"]:not([hidden])',
  '[data-slot="alert-dialog-content"]:not([hidden])',
  '[data-slot="drawer-content"]:not([hidden])',
  '[data-slot="sheet-content"]:not([hidden])',
  '[data-slot="popover-content"]:not([hidden])',
  '[data-slot="dropdown-menu-content"]:not([hidden])',
  '[data-slot="context-menu-content"]:not([hidden])',
  '[data-slot="select-content"]:not([hidden])',
  '[data-slot="combobox-content"]:not([hidden])',
  '[data-slot="menubar-content"]:not([hidden])',
].join(', ')

export const isAnyOverlayOpen = (doc: Document): boolean => doc.querySelector(OPEN_OVERLAY_SELECTOR) != null

export const isBodyScrollLocked = (body: HTMLElement): boolean => {
  const { overflow, overflowX, overflowY } = body.style
  return overflow === 'hidden' || overflowX === 'hidden' || overflowY === 'hidden'
}

/**
 * Clears a stuck scroll lock from the body.
 *
 * MUI's `ModalManager` and Base UI's scroll locker both write `overflow: hidden` to the
 * body and restore it on close — MUI synchronously, Base UI via a deferred `setTimeout(0)`.
 * When a Base UI overlay opens on top of an already-locked body (e.g. a dropdown inside a
 * MUI dialog while the page is scrollable in mobile view), Base UI captures `hidden` as the
 * "original" value and writes it back *after* MUI has already cleared it — leaving the body
 * permanently locked and the page unscrollable.
 *
 * This restores the body only when no overlay is actually open, so a legitimate lock is
 * never disturbed.
 *
 * @returns `true` if a stuck lock was cleared.
 */
export const unlockBodyScrollIfStuck = (doc: Document): boolean => {
  const body = doc.body
  if (!body || !isBodyScrollLocked(body) || isAnyOverlayOpen(doc)) {
    return false
  }

  body.style.removeProperty('overflow')
  body.style.removeProperty('overflow-x')
  body.style.removeProperty('overflow-y')
  body.style.removeProperty('padding-right')
  return true
}

// Debounce so the check runs after all open/close churn (incl. Base UI's deferred restore) settles.
const DEBOUNCE_MS = 100

/**
 * Watches the body for a stuck `overflow: hidden` left behind after every overlay has closed,
 * and clears it so scrolling keeps working. See {@link unlockBodyScrollIfStuck}.
 */
const useUnlockBodyScroll = (): void => {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined

    const scheduleCheck = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => unlockBodyScrollIfStuck(document), DEBOUNCE_MS)
    }

    const observer = new MutationObserver(scheduleCheck)
    // `attributes` catches a stuck `overflow: hidden` on the body; `childList` catches an overlay unmount.
    // The latter matters when a restore runs mid exit-transition (e.g. MUI's ~225ms Drawer): the node is
    // still present so the first check bails, and only the unmount triggers a re-check.
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'], childList: true })

    return () => {
      if (timer) clearTimeout(timer)
      observer.disconnect()
    }
  }, [])
}

export default useUnlockBodyScroll

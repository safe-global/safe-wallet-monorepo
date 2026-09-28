import type { MouseEvent } from 'react'

/** Pylon portal form the "Talk to sales" CTAs open. */
export const CONTACT_SALES_FORM_URL = 'https://safe.portal.usepylon.com/forms/safe-pro-contact-sales'

/** Size of the popup window Pylon portal forms open in. */
export const PYLON_FORM_WIDTH = 480
export const PYLON_FORM_HEIGHT = 720

/** Opens a Pylon portal form in a small popup window centred over the current one. */
export const openPylonForm = (url: string, width = PYLON_FORM_WIDTH, height = PYLON_FORM_HEIGHT) => {
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2)
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2)
  const features = `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},noopener,noreferrer`

  window.open(url, '_blank', features)
}

/**
 * Click handler for "Talk to sales" links. They keep `href={CONTACT_SALES_FORM_URL}` so middle-click and
 * "open in new tab" still work; a plain click opens the form in a popup instead.
 */
export const openContactSalesForm = (event?: MouseEvent<HTMLElement>) => {
  if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)) return
  event?.preventDefault()
  openPylonForm(CONTACT_SALES_FORM_URL)
}

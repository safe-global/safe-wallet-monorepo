import type { MouseEvent } from 'react'

/** Zoho Bookings page the "Talk to sales" CTAs open, to schedule a call with sales. */
export const CONTACT_SALES_URL = 'https://zbooking.eu/3H4cf'

/** Default size of the popup window external forms open in. */
export const FORM_POPUP_WIDTH = 480
export const FORM_POPUP_HEIGHT = 720

/** Opens an external form in a small popup window centred over the current one. */
export const openFormPopup = (url: string, width = FORM_POPUP_WIDTH, height = FORM_POPUP_HEIGHT) => {
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2)
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2)
  const features = `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},noopener,noreferrer`

  window.open(url, '_blank', features)
}

/**
 * Click handler for "Talk to sales" links. They keep `href={CONTACT_SALES_URL}` so middle-click and
 * "open in new tab" still work; a plain click opens the booking page in a popup instead.
 */
export const openContactSales = (event?: MouseEvent<HTMLElement>) => {
  if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)) return
  event?.preventDefault()
  openFormPopup(CONTACT_SALES_URL)
}

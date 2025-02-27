import * as main from './main.page.js'

export const notificationsTitle = '[data-testid="notifications-title"]'
export const notificationsLogo = '[data-testid="notifications-icon"]'
export const pushNotificationsBtn = '[data-testid="notifications-button"]'

export function checkCoreElementsVisible() {
  main.verifyElementsIsVisible([notificationsLogo, notificationsTitle, pushNotificationsBtn])
}




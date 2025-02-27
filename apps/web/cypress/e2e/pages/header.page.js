export const notificationsBtn = '[data-testid="notifications-center"]'

export function openNotificationCenter() {
  cy.get(notificationsBtn).click()
}


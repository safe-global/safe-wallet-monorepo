const SAFE_PRO_CATEGORY = 'safe-pro'

const event = (action: string) => ({ action, category: SAFE_PRO_CATEGORY })

export const SAFE_PRO_EVENTS = {
  SAFE_PRO_BANNER_VIEWED: event('Safe Pro banner viewed'),
  FREE_ACCESS_OFFER_VIEWED: event('Free access offer viewed'),
  FREE_ACCESS_CLAIM_CLICKED: event('Free access claim clicked'),
  FREE_ACCESS_OFFER_DISMISSED: event('Free access offer dismissed'),
  SAFE_ACCOUNT_SELECTION_VIEWED: event('Safe account selection viewed'),
  SAFE_ACCOUNT_SELECTION_SUBMITTED: event('Safe account selection submitted'),
  WORKSPACE_CREATE_STEP_VIEWED: event('Workspace create step viewed'),
  PLAN_SELECTION_STARTED: event('Plan selection started'),
  PLANS_PAGE_VIEWED: event('Plans page viewed'),
  PLAN_CTA_CLICKED: event('Plan CTA clicked'),
  PLAN_CHANGE_CONFIRMED: event('Plan change confirmed'),
  CHECKOUT_STARTED: event('Checkout started'),
  CHECKOUT_RETURNED: event('Checkout returned'),
  FREE_ACCESS_REMINDER_VIEWED: event('Free access reminder viewed'),
  WORKSPACE_LOCKED_VIEWED: event('Workspace locked viewed'),
  UPGRADE_PROMPT_VIEWED: event('Upgrade prompt viewed'),
}

/**
 * Every new word in the Pro trial rework, in one place so Design and GTM can edit it.
 * Functions take what changes (plan name, date, price) and return the sentence.
 */
export const PRO_TRIAL_COPY = {
  /** First line on every Pro surface. */
  safesStayFree: 'Your Safe Accounts stay free and fully yours.',
  upgradeTo: (planName: string) => `Upgrade to ${planName}`,
  talkToUs: 'Talk to us',
} as const

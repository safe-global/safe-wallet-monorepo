/**
 * Every new word in the Pro trial rework, in one place so Design and GTM can edit it.
 * Functions take what changes (plan name, date, price) and return the sentence.
 */
export const PRO_TRIAL_COPY = {
  /** First line on every Pro surface. */
  safesStayFree: 'Your Safe Accounts stay free and fully yours.',
  upgradeTo: (planName: string) => `Upgrade to ${planName}`,
  talkToUs: 'Talk to us',
  recommended: 'Recommended for you',
  fromPrice: (price: string) => `from ${price}`,
  seatsLabel: 'Safe accounts',
  trialTitle: 'Pro trial',
  trialStatus: (until: string) => `Your trial includes every Pro feature until ${until}.`,
  planName: (plan: string, seats: number | null | undefined) => (seats ? `${plan} ${seats}` : plan),
} as const

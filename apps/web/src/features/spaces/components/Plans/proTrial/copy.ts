/**
 * Every new word in the Pro trial rework, in one place so Design and GTM can edit it.
 * Functions take what changes (plan name, date, price) and return the sentence.
 */
export const PRO_TRIAL_COPY = {
  /** First line on every Pro surface. */
  safesStayFree: 'Your Safe Accounts stay free and fully yours.',
  upgradeTo: (planName: string) => `Upgrade to ${planName}`,
  talkToUs: 'Talk to us',
  /** A multi-size plan before a size is picked. */
  unpickedPrice: { headline: 'Custom', suffix: 'price per Safe' },
  fromPrice: (price: string) => `from ${price}`,
  seatsShort: (seats: number) => `${seats} Safes`,
  /** A plan with one size, e.g. "2 Safe accounts" → "2 Safes". */
  seatsFixed: (label: string) => label.replace(/Safe accounts$/, 'Safes'),
  trialTitle: 'Pro trial',
  trialStatus: (until: string) => `Your trial includes every Pro feature until ${until}.`,
  planName: (plan: string, seats: number | null | undefined) => (seats ? `${plan} ${seats}` : plan),
} as const

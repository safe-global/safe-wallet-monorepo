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
  /** Under "Custom" before a size is picked; every Business size saves about 10% yearly. */
  unpickedSaving: 'Save 10% with annual',
  fromPrice: (price: string) => `from ${price}`,
  seatsShort: (seats: number) => `${seats} Safes`,
  /** A plan with one size, e.g. "2 Safe accounts" → "2 Safes". */
  seatsFixed: (label: string) => label.replace(/Safe accounts$/, 'Safes'),
  trialTitle: 'Pro trial',
  trialStatus: (until: string) => `Your trial includes every Pro feature until ${until}.`,
  planName: (plan: string, seats: number | null | undefined) => (seats ? `${plan} ${seats}` : plan),

  handoff: {
    price: (price: string) => `${price}/mo for this Workspace, billed monthly.`,
    noCharge: "You'll confirm the payment on Stripe. Nothing is charged until you do.",
    continue: 'Continue to Stripe',
    opening: 'Opening Stripe Checkout…',
    back: 'Back',
    error: 'We couldn’t start the checkout. Please try again.',
  },

  banner: {
    regionLabel: 'Safe Pro trial',
    normal: (endsOn: string) => `Pro trial · ends ${endsOn}`,
    urgent: (daysLeft: number, endsOn: string) =>
      daysLeft <= 0
        ? `Your Pro trial ends today (${endsOn})`
        : daysLeft === 1
          ? `Your Pro trial ends tomorrow (${endsOn})`
          : `Your Pro trial ends in ${daysLeft} days (${endsOn})`,
    seePlans: 'See plans',
  },

  trialEnded: {
    title: 'Your Safes still work',
    body: (endedOn: string | null) =>
      `Your Pro trial ended${endedOn ? ` on ${endedOn}` : ''}. Nothing was charged. Policies, the activity log and other Pro features are paused until you pick a plan.`,
    fit: (planName: string, safes: number) => `${planName} fits your ${safes} Safe${safes === 1 ? '' : 's'}`,
    continue: 'Continue to my Safes',
    seePlans: 'See all plans',
  },

  trialStart: {
    title: 'Run your treasury like a team',
    migrated: "You've used Safe before, so your trial is 60 days instead of 30.",
    groups: [
      { id: 'control', title: 'Control', items: ['Policy engine', 'Transaction proposers'] },
      { id: 'visibility', title: 'Visibility', items: ['Activity log', 'Shared address book'] },
      { id: 'security', title: 'Security', items: ['Advanced threat analysis', 'Transaction simulation', 'MFA'] },
    ],
    noCharge: 'No card. No charge. The trial ends on its own.',
    endsOn: (date: string) => `Trial ends ${date}.`,
    start: 'Start free trial',
    seePlans: 'See plans and pricing',
    back: 'Go to My accounts',
    unavailable: 'There is no trial available for this Workspace.',
  },
} as const

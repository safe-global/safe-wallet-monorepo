/** Every word the Pro trial banner shows. `daysLeft` counts calendar days, 0 being the last day. */
export const PRO_TRIAL_BANNER_COPY = {
  /** Names the banner's landmark for screen readers. */
  regionLabel: 'Safe Pro trial',

  normal: {
    status: (endsOn: string) => `Pro trial · ends ${endsOn}`,
    seePlans: 'See plans',
  },

  urgent: {
    status: (daysLeft: number, endsOn: string) => {
      if (daysLeft <= 0) return `Your Pro trial ends today (${endsOn})`
      if (daysLeft === 1) return `Your Pro trial ends tomorrow (${endsOn})`
      return `Your Pro trial ends in ${daysLeft} days (${endsOn})`
    },
    /** Always names the plan, never a bare "Upgrade". */
    upgrade: (planName: string) => `Upgrade to ${planName}`,
    talkToUs: 'Talk to us',
  },

  details: {
    toggle: 'What happens next?',
    lines: [
      'Your Safe Accounts stay free and fully yours.',
      'Pro is billed per Workspace.',
      'No charge if you do nothing. Your trial simply ends.',
    ],
  },
} as const

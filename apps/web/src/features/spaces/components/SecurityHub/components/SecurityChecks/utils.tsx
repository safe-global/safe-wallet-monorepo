import type { ReactNode } from 'react'
import type { Cta } from './primitives'

/**
 * Fallback CTA for a Zodiac vulnerability when we can't offer an in-app removal —
 * either we have no deep-link (chain metadata still loading), or the Safe is only
 * implicated via a related account (no removable module here). Points at Zodiac's
 * public checker.
 */
export const ZODIAC_VULNERABILITY_CTA: Cta = {
  label: 'Check affected Safes',
  href: 'https://app.zodiac.eco/public/fallback-handler',
}

/** Shared intro shown for any Zodiac-vulnerability finding (per-module rows and the nested warning). */
export const VULNERABLE_MODULE_INTRO: ReactNode = (
  <>
    <span className="font-bold">This Safe is affected by a vulnerable third-party module.</span> A Zodiac Delay v1.1.0
    or Roles v2.1.0 module associated with it has a known critical vulnerability. We advise you to take immediate
    action.
  </>
)

/**
 * Intro copy + CTA for a single module row, keyed on its verdict:
 * - vulnerable → the modules deep-link (labelled "Remove unsupported module"), falling back
 *   to the external checker when we have no deep-link,
 * - trusted → no CTA,
 * - unrecognized → the generic "review modules" CTA.
 *
 * The vulnerable CTA deep-links to the target Safe's Modules settings rather than launching
 * the remove flow in place: the tx flow, simulation and Safe Shield all key off the *active*
 * Safe, which the Spaces drawer does not set — so an in-place flow would run against the wrong
 * Safe and never resolve. `modulesCta` already carries the "Remove unsupported module" label
 * (from the scanner's `ctaLabelOverride`) and the correct `?safe=` deep-link.
 */
export const getModuleRowContent = (
  verdict: { vulnerable: boolean; trusted: boolean },
  modulesCta: Cta | null,
): { intro: ReactNode; cta: Cta | null } => {
  if (verdict.vulnerable) {
    return { intro: VULNERABLE_MODULE_INTRO, cta: modulesCta ?? ZODIAC_VULNERABILITY_CTA }
  }
  if (verdict.trusted) {
    return { intro: 'Recognized Safe ecosystem module.', cta: null }
  }
  return {
    intro:
      "Unrecognized module — not in the known Safe ecosystem deployments. Review carefully and remove if you don't recognize it.",
    cta: modulesCta,
  }
}

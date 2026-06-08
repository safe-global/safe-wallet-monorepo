import type { Cta } from './primitives'

/**
 * Fallback CTA for a Zodiac vulnerability when we can't offer an in-app removal —
 * either no remove handler was provided, or the Safe is only implicated via a
 * related account (no removable module here). Points at Zodiac's public checker.
 */
export const ZODIAC_VULNERABILITY_CTA: Cta = {
  label: 'Check affected Safes',
  href: 'https://app.zodiac.eco/public/fallback-handler',
}

/**
 * Intro copy + CTA for a single module row, keyed on its verdict:
 * - vulnerable → remove action (or the external checker when no in-app handler),
 * - trusted → no CTA,
 * - unrecognized → the generic "review modules" CTA.
 */
export const getModuleRowContent = (
  module: { value: string; name?: string | null },
  verdict: { vulnerable: boolean; trusted: boolean },
  modulesCta: Cta | null,
  onRemoveModule?: (address: string) => void,
): { intro: string; cta: Cta | null } => {
  if (verdict.vulnerable) {
    return {
      intro:
        'This module is affected by a known Zodiac security vulnerability. Remove it immediately to protect your funds.',
      cta: onRemoveModule
        ? { label: 'Remove unsupported module', onClick: () => onRemoveModule(module.value) }
        : ZODIAC_VULNERABILITY_CTA,
    }
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

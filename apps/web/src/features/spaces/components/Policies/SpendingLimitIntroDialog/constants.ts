/**
 * localStorage flag recording that the spending limit intro has been shown.
 *
 * The intro explains the concept, not a particular Safe account, so one browser-wide key is
 * right — keying it per space or per Safe would replay the same explanation on every new
 * account. It follows that a different browser, cleared site data or a private window shows the
 * intro again: there is no server-side "already read" store to hang this on.
 */
export const SPENDING_LIMIT_INTRO_SEEN_KEY = 'spendingLimitIntroSeen'

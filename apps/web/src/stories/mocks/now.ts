const MINUTE_MS = 60 * 1000

/**
 * The current time, rounded down to the minute, for absolute dates that a story shows. The visual sweep starts the
 * clock at a fixed minute and lets it run, so Date.now() would put a different second into each run's screenshot.
 * Keep Date.now() for an age the component measures against its own clock ("10 seconds ago", a cooldown): rounding
 * would add up to 59 seconds to it.
 */
export const mockNow = (): number => Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS

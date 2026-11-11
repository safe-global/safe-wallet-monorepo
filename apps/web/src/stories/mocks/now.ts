const MINUTE_MS = 60 * 1000

/**
 * The current time, rounded down to the minute, for dates in mock data. The visual sweep starts the clock at a
 * fixed minute and lets it run, so Date.now() would put a different second into each run's screenshot.
 */
export const mockNow = (): number => Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS

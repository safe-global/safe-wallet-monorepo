/**
 * Refresh options for space queries whose data can change in other sessions
 * (e.g. an admin adds/removes accounts, members or contacts).
 *
 * - `refetchOnFocus` refetches when the window/tab regains focus.
 * - `refetchOnMountOrArgChange` refetches on new subscriptions (page navigation)
 *   when the cached data is older than the given number of seconds.
 */
export const SPACE_REFRESH_OPTIONS = {
  refetchOnFocus: true,
  refetchOnMountOrArgChange: 30,
} as const

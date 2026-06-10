import type { UrlObject } from 'url'
import { AppRoutes } from '@/config/routes'
import { parseNextUrlForRouter } from '@/utils/nextUrl'

/**
 * Where the Create / Load Safe flows return to when the user cancels or backs
 * out of the first step.
 *
 * If they arrived with a `next` query param (e.g. from a Space via the "Manage
 * accounts" dialog), return to that page. Otherwise — a direct link, or a
 * `next` that fails the same-origin/self-redirect checks — fall back to the
 * Spaces overview.
 */
export const getNewSafeReturnUrl = (next: unknown): UrlObject | string => {
  return parseNextUrlForRouter(next) ?? AppRoutes.welcome.spaces
}

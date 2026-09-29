import type { UrlObject } from 'url'
import { AppRoutes } from '@/config/routes'

export const getSafeSettingsHref = (shortName: string | undefined, address: string): UrlObject | undefined =>
  shortName ? { pathname: AppRoutes.settings.setup, query: { safe: `${shortName}:${address}` } } : undefined

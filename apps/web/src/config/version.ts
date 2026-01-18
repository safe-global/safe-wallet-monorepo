const rawAppVersion = process.env.NEXT_PUBLIC_APP_VERSION
const rawAppHomepage = process.env.NEXT_PUBLIC_APP_HOMEPAGE
if (!rawAppVersion) {
  throw new Error('Environment variable NEXT_PUBLIC_APP_VERSION is required but was not set or is empty.')
}
if (!rawAppHomepage) {
  throw new Error('Environment variable NEXT_PUBLIC_APP_HOMEPAGE is required but was not set or is empty.')
}
export const APP_VERSION = rawAppVersion
export const APP_HOMEPAGE = rawAppHomepage

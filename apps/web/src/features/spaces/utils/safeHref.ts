export type SafeHref = { pathname: string; query: { safe: string } }

export const buildSafeHref = (
  pathname: string,
  shortName: string | undefined,
  address: string,
): SafeHref | undefined => (shortName ? { pathname, query: { safe: `${shortName}:${address}` } } : undefined)

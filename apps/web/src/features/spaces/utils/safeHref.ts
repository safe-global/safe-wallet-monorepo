import { withSpaceId } from '@/hooks/useUrlSpaceId'

export type SafeHref = { pathname: string; query: { safe: string; spaceId?: string } }

/** A link to `pathname` for the Safe, in the given Workspace; undefined when the chain has no short name. */
export const buildSafeHref = (
  pathname: string,
  shortName: string | undefined,
  address: string,
  spaceId: string | null,
): SafeHref | undefined =>
  shortName ? { pathname, query: withSpaceId({ safe: `${shortName}:${address}` }, spaceId) } : undefined

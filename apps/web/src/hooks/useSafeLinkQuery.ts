import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSpaceIdQuery, type SpaceIdQuery } from './useUrlSpaceId'

export type SafeLinkQuery = SpaceIdQuery & { safe?: string | string[] }

/** The query of a link to the current Safe, in the Workspace of this tab. */
export const useSafeLinkQuery = (): SafeLinkQuery => {
  const { safe } = useRouter().query
  const spaceIdQuery = useSpaceIdQuery()

  return useMemo(() => (safe === undefined ? spaceIdQuery : { safe, ...spaceIdQuery }), [safe, spaceIdQuery])
}

import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { useUrlSpaceId, withSpaceId } from './useUrlSpaceId'

export type SafeLinkQuery = { safe?: string | string[]; spaceId?: string }

/** Query params for a link to the Safe of the current URL: its `safe` and, if present, its `spaceId`. */
export const useSafeLinkQuery = (): SafeLinkQuery => {
  const { safe } = useRouter().query
  const spaceId = useUrlSpaceId()

  return useMemo(() => withSpaceId(safe === undefined ? {} : { safe }, spaceId), [safe, spaceId])
}

import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

const useAppsSearch = (apps: SafeAppData[], query: string): SafeAppData[] => {
  const fuse = useMemo(
    () =>
      new Fuse(apps, {
        keys: [
          {
            name: 'name',
            weight: 0.99,
          },
          {
            name: 'description',
            weight: 0.5,
          },
          {
            name: 'tags',
            weight: 0.99,
          },
        ],
        // https://fusejs.io/api/options.html#threshold
        // Very naive explanation: threshold represents how accurate the search results should be. The default is 0.6
        // I tested it and found it to make the search results more accurate when the threshold is 0.3
        // 0 - 1, where 0 is the exact match and 1 matches anything
        threshold: 0.3,
        findAllMatches: true,
      }),
    [apps],
  )

  const results = useMemo(() => (query ? fuse.search(query).map((result) => result.item) : apps), [fuse, apps, query])

  return results
}

export { useAppsSearch }

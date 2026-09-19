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
        // fuse.js threshold (0 = exact … 1 = anything; default 0.6). 0.3 tested as more accurate here.
        // https://fusejs.io/api/options.html#threshold
        threshold: 0.3,
        findAllMatches: true,
      }),
    [apps],
  )

  const results = useMemo(() => (query ? fuse.search(query).map((result) => result.item) : apps), [fuse, apps, query])

  return results
}

export { useAppsSearch }

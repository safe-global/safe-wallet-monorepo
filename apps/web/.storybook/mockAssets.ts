import { http, passthrough } from 'msw'
import { isMirroredImage, MOCK_ASSETS_PATH } from './mockAssetUrls'

/**
 * Answers remote image URLs from the committed mirror in ./mock-assets, so stories render the
 * same logos offline and in visual tests. Images not in the mirror still load from the network.
 * Refresh the mirror with scripts/storybook/mirror-assets.ts.
 */
export const mockAssetHandlers = [
  http.get(/^https:\/\//, async ({ request }) => {
    const url = new URL(request.url)
    if (url.origin === location.origin || !isMirroredImage(url)) return passthrough()
    const local = await fetch(`${MOCK_ASSETS_PATH}/${url.hostname}${url.pathname}`)
    return local.ok ? local : passthrough()
  }),
]

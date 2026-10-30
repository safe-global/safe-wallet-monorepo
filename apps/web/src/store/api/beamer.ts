import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

type NumberFeaturesResponse = {
  number?: number
  lastPostId?: number
  lastPostBoostedAnnouncementType?: number
  lastPostTitle?: string
  lastPostCategory?: string
  lastPostLinkText?: string
  lastPostLinkUrl?: string
}

export type BeamerTopBar = {
  postId: number
  title: string
  category?: string
  link?: { text: string; url: string }
}

export type BeamerUpdates = {
  unreadCount: number
  topBar?: BeamerTopBar
}

const TOP_BAR_ANNOUNCEMENT_TYPE = 1

export const parseBeamerUpdates = (response: NumberFeaturesResponse): BeamerUpdates => {
  const { lastPostId, lastPostTitle, lastPostLinkText, lastPostLinkUrl } = response
  const isTopBar = response.lastPostBoostedAnnouncementType === TOP_BAR_ANNOUNCEMENT_TYPE && lastPostId && lastPostTitle
  const linkUrl = lastPostLinkUrl?.startsWith('https://') ? lastPostLinkUrl : undefined

  return {
    unreadCount: response.number ?? 0,
    topBar: isTopBar
      ? {
          postId: lastPostId,
          title: lastPostTitle,
          category: response.lastPostCategory,
          link: lastPostLinkText && linkUrl ? { text: lastPostLinkText, url: linkUrl } : undefined,
        }
      : undefined,
  }
}

export const beamerApi = createApi({
  reducerPath: 'beamerApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://backend.getbeamer.com' }),
  endpoints: (builder) => ({
    getBeamerUpdates: builder.query<BeamerUpdates, { productId: string; lastSeen?: string }>({
      query: ({ productId, lastSeen }) => ({
        url: 'numberFeatures',
        params: { product: productId, url: window.location.host, v: 1, date: lastSeen },
      }),
      transformResponse: parseBeamerUpdates,
    }),
  }),
})

export const { useGetBeamerUpdatesQuery } = beamerApi

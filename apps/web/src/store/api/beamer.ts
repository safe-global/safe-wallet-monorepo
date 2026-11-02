import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const BEAMER_ORIGIN = 'https://app.getbeamer.com'
const BEAMER_API_URL = 'https://backend.getbeamer.com'

type NumberFeaturesResponse = {
  number?: number
  lastPostId?: number
  lastPostBoostedAnnouncementType?: number
  lastPostTitle?: string
  lastPostCategory?: string
  lastPostBody?: string
  lastPostImageUrl?: string
  lastPostLinkText?: string
  lastPostLinkUrl?: string
}

type Post = {
  postId: number
  title: string
}

export type WhatsNewTopBarPost = Post & {
  category?: string
  link?: { text: string; url: string }
}

export type WhatsNewCornerCardPost = Post & {
  body?: string
  imageUrl?: string
}

export type WhatsNewUpdates = {
  unreadCount: number
  topBar?: WhatsNewTopBarPost
  cornerCard?: WhatsNewCornerCardPost
}

const TOP_BAR_ANNOUNCEMENT_TYPE = 1
const CORNER_CARD_ANNOUNCEMENT_TYPE = 3

const httpsOnly = (url?: string): string | undefined => (url?.startsWith('https://') ? url : undefined)

const parseTopBar = (post: Post, response: NumberFeaturesResponse): WhatsNewTopBarPost => {
  const linkText = response.lastPostLinkText
  const linkUrl = httpsOnly(response.lastPostLinkUrl)

  return {
    ...post,
    category: response.lastPostCategory,
    link: linkText && linkUrl ? { text: linkText, url: linkUrl } : undefined,
  }
}

const parseCornerCard = (post: Post, response: NumberFeaturesResponse): WhatsNewCornerCardPost => ({
  ...post,
  body: response.lastPostBody,
  imageUrl: httpsOnly(response.lastPostImageUrl),
})

export const parseBeamerUpdates = (response: NumberFeaturesResponse): WhatsNewUpdates => {
  const unreadCount = response.number ?? 0
  const { lastPostId: postId, lastPostTitle: title, lastPostBoostedAnnouncementType: type } = response
  if (!postId || !title) return { unreadCount }

  const post = { postId, title }
  return {
    unreadCount,
    topBar: type === TOP_BAR_ANNOUNCEMENT_TYPE ? parseTopBar(post, response) : undefined,
    cornerCard: type === CORNER_CARD_ANNOUNCEMENT_TYPE ? parseCornerCard(post, response) : undefined,
  }
}

export const beamerApi = createApi({
  reducerPath: 'beamerApi',
  baseQuery: fetchBaseQuery({ baseUrl: BEAMER_API_URL }),
  tagTypes: ['BeamerUpdates'],
  endpoints: (builder) => ({
    getBeamerUpdates: builder.query<WhatsNewUpdates, { productId: string; lastSeen?: string }>({
      query: ({ productId, lastSeen }) => ({
        url: 'numberFeatures',
        // v=1 is what Beamer's own embed script sends with this request.
        params: { product: productId, url: window.location.host, v: 1, date: lastSeen },
        // Beamer lets browsers cache this answer for 20 minutes, which would hide a post announced in the meantime.
        cache: 'no-cache',
      }),
      transformResponse: parseBeamerUpdates,
      providesTags: ['BeamerUpdates'],
    }),
  }),
})

export const { useGetBeamerUpdatesQuery } = beamerApi

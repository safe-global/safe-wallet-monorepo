import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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

const toText = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined)

const toHttpsUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return undefined
  }
  return url.protocol === 'https:' ? url.href : undefined
}

const parseTopBar = (response: unknown): BeamerTopBar | undefined => {
  const post = (response ?? {}) as Record<string, unknown>
  const title = toText(post.lastPostTitle)
  if (
    post.lastPostBoostedAnnouncementType !== TOP_BAR_ANNOUNCEMENT_TYPE ||
    typeof post.lastPostId !== 'number' ||
    !title
  ) {
    return undefined
  }
  const linkText = toText(post.lastPostLinkText)
  const linkUrl = toHttpsUrl(post.lastPostLinkUrl)
  return {
    postId: post.lastPostId,
    title,
    category: toText(post.lastPostCategory),
    link: linkText && linkUrl ? { text: linkText, url: linkUrl } : undefined,
  }
}

export const parseBeamerUpdates = (response: unknown): BeamerUpdates => {
  const { number } = (response ?? {}) as { number?: unknown }
  const isCount = typeof number === 'number' && Number.isInteger(number) && number >= 0
  return { unreadCount: isCount ? number : 0, topBar: parseTopBar(response) }
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

/**
 * Generic function to extract cursor parameter from Safe Gateway API pagination URLs.
 * All Safe Gateway APIs use cursor-based pagination with the same URL structure.
 *
 * @param url - The pagination URL (next or previous)
 * @param direction - Direction for error logging purposes ('next' or 'previous')
 * @returns The cursor for the page, or undefined if no cursor found
 */
const extractCursorFromUrl = (url: string | null | undefined, direction: 'next' | 'previous') => {
  if (!url) {
    return undefined
  }

  // Extract the cursor from the URL using URLSearchParams
  // This is more robust than using string.split when dealing with complex URLs
  try {
    // The URL might be a relative URL like /v1/chains/{chainId}/safes/{safeAddress}/endpoint?cursor=XYZ&other=param
    // or a full URL with hostname
    const urlParts = url.split('?')
    if (urlParts.length < 2) {
      return undefined // No query string in the URL
    }

    const queryString = urlParts[1]
    const searchParams = new URLSearchParams(queryString)
    const cursor = searchParams.get('cursor')

    if (!cursor || !cursor.trim()) {
      return undefined
    }

    return cursor
  } catch (error) {
    console.error(`Error extracting cursor from ${direction} URL:`, error)
    return undefined
  }
}

/**
 * Generic function to extract the next page parameter from Safe Gateway API responses.
 *
 * @param lastPage - The last page response from the API
 * @returns The cursor for the next page, or undefined if no more pages
 */
export const getNextPageParam = (lastPage: { next?: string | null }) => {
  if (!lastPage) {
    return undefined
  }

  return extractCursorFromUrl(lastPage.next, 'next')
}

/**
 * Generic function to extract the previous page parameter from Safe Gateway API responses.
 *
 * @param firstPage - The first page response from the API
 * @returns The cursor for the previous page, or undefined if no more pages
 */
export const getPreviousPageParam = (firstPage: { previous?: string | null }) => {
  if (!firstPage) {
    return undefined
  }

  return extractCursorFromUrl(firstPage.previous, 'previous')
}

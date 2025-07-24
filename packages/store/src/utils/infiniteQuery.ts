/**
 * Generic function to extract the next page parameter from Safe Gateway API responses.
 * All Safe Gateway APIs use cursor-based pagination with the same URL structure.
 *
 * @param lastPage - The last page response from the API
 * @returns The cursor for the next page, or undefined if no more pages
 */
export const getNextPageParam = (lastPage: { next?: string | null }) => {
  if (!lastPage || !lastPage.next) {
    return undefined
  }

  // Extract the cursor from the next URL using URLSearchParams
  // This is more robust than using string.split when dealing with complex URLs
  try {
    // The URL might be a relative URL like /v1/chains/{chainId}/safes/{safeAddress}/endpoint?cursor=XYZ&other=param
    // or a full URL with hostname
    const urlParts = lastPage.next.split('?')
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
    console.error('Error extracting cursor from next URL:', error)
    return undefined
  }
}

export const getOriginPath = (url: string): string => {
  try {
    const { origin, pathname } = new URL(url)
    return origin + (pathname === '/' ? '' : pathname)
  } catch (e) {
    console.error('Error parsing URL', url, e)
    return url
  }
}

export const NEWS_BANNER_STORAGE_KEY = 'dismissedNewsBanners'

export const getSlidePosition = (start: number, end: number, width: number | undefined, gap = 0, threshold = 0.1) => {
  if (!width) return start

  const delta = end - start
  if (delta === 0) return start

  const direction = Math.sign(delta) // +1 next slide, –1 previous slide
  const distance = Math.abs(delta) // pixels actually dragged
  const bannerGap = direction * gap // gap between banners

  // If we dragged far enough, jump one slide in the drag direction,
  // otherwise snap back to where we started.
  if (distance >= width * threshold) {
    const targetIndex = Math.abs(Math.round((start + direction * width) / width))
    return targetIndex * width + bannerGap
  }

  // Not enough distance: stay on the original slide
  return Math.round(start / width) * width
}

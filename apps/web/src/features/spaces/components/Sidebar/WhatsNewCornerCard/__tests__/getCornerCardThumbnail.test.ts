import { getCornerCardThumbnail } from '../getCornerCardThumbnail'

describe('getCornerCardThumbnail', () => {
  it.each([
    ['New', 'announcement'],
    ['Improvement', 'safeStandard'],
    ['Fix', 'security'],
    ['Safe Pro', 'safePro'],
    ['Earn', 'coins'],
  ])('should show the %s category as the %s thumbnail', (category, variant) => {
    expect(getCornerCardThumbnail(category)).toBe(variant)
  })

  it('should match a category regardless of case and surrounding spaces', () => {
    expect(getCornerCardThumbnail('  SAFENET ')).toBe('safenet')
  })

  it('should, when the post has several categories, use the first one that has a thumbnail', () => {
    expect(getCornerCardThumbnail('Unknown, Swap; New')).toBe('swap')
  })

  it.each([undefined, '', 'Something new'])('should show the Safe logo for the category %p', (category) => {
    expect(getCornerCardThumbnail(category)).toBe('safe')
  })
})

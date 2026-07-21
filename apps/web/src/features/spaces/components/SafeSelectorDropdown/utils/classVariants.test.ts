import { getSafeSelectorClassVariants } from './classVariants'

describe('getSafeSelectorClassVariants', () => {
  it('reserves the chevron zone on the openable trigger so trailing content is not clipped', () => {
    const variants = getSafeSelectorClassVariants(false)

    expect(variants.canOpen).toBe(true)
    expect(variants.triggerClass).toContain('pr-12')
    expect(variants.iconWrapperClass).not.toContain('hidden')
  })

  it('keeps the single-safe trigger inset without a chevron zone', () => {
    const variants = getSafeSelectorClassVariants(true)

    expect(variants.canOpen).toBe(false)
    expect(variants.triggerClass).toContain('pr-10')
    expect(variants.iconWrapperClass).toContain('hidden')
  })
})

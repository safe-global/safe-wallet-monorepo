import { getSafeSelectorClassVariants } from './classVariants'

describe('getSafeSelectorClassVariants', () => {
  it('reserves the chevron zone on the openable trigger so trailing content is not clipped', () => {
    const variants = getSafeSelectorClassVariants(false)

    expect(variants.canOpen).toBe(true)
    expect(variants.triggerClass).toContain('pr-12')
    expect(variants.iconWrapperClass).not.toContain('hidden')
  })

  it('pads the chevron past the trigger overshoot so it is not flush with the pill', () => {
    // The trigger is `absolute inset-0` in a `-m-4` wrapper, so its right edge sits 8px outside
    // the pill. `pr-4` spends 8px covering that and leaves 8px visible — the same gap the network
    // chip beside it gets from its `px-2`. `pr-2.5` left 2px and read as flush.
    expect(getSafeSelectorClassVariants(false).iconWrapperClass).toContain('pr-4')
  })

  it('keeps the single-safe trigger inset without a chevron zone', () => {
    const variants = getSafeSelectorClassVariants(true)

    expect(variants.canOpen).toBe(false)
    expect(variants.triggerClass).toContain('pr-10')
    expect(variants.iconWrapperClass).toContain('hidden')
  })
})

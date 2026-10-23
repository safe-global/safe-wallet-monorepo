import { DesignFeedbackFeature } from './index'

describe('design feedback availability', () => {
  const original = process.env.NEXT_PUBLIC_IS_PRODUCTION
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_IS_PRODUCTION
    else process.env.NEXT_PUBLIC_IS_PRODUCTION = original
  })

  it('is enabled in preview builds', () => {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'false'
    expect(DesignFeedbackFeature.useIsEnabled()).toBe(true)
  })

  it('is disabled in production', () => {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
    expect(DesignFeedbackFeature.useIsEnabled()).toBe(false)
  })
})

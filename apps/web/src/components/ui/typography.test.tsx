import { typographyVariants } from './typography'

describe('typographyVariants', () => {
  it('does not emit negative tracking classes', () => {
    const variants = ['h1', 'h2', 'h3', 'h4', 'paragraph', 'paragraph-small', 'paragraph-mini'] as const

    for (const variant of variants) {
      expect(typographyVariants({ variant })).not.toContain('tracking-[-')
    }
  })
})

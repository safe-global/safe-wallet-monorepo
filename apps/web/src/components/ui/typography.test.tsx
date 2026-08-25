import { typographyVariants } from './typography'

describe('typographyVariants', () => {
  it('does not emit negative tracking classes', () => {
    const variants = [
      'h1',
      'h2',
      'h3',
      'h4',
      'paragraph-large',
      'paragraph-large-bold',
      'paragraph',
      'paragraph-small',
      'paragraph-mini',
    ] as const

    for (const variant of variants) {
      expect(typographyVariants({ variant })).not.toContain('tracking-[-')
    }
  })

  it('renders paragraph-large at 18px/27px regular, distinct from its bold sibling', () => {
    expect(typographyVariants({ variant: 'paragraph-large' })).toContain('font-normal')
    expect(typographyVariants({ variant: 'paragraph-large' })).toContain('text-lg')
    expect(typographyVariants({ variant: 'paragraph-large' })).toContain('leading-[27px]')
    expect(typographyVariants({ variant: 'paragraph-large' })).not.toContain('font-semibold')
  })
})

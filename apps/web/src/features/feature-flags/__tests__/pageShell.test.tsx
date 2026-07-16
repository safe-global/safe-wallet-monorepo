import type { GetStaticPropsContext } from 'next'
import { getStaticProps } from '@/pages/feature-flags'

// Colocated here rather than next to the page: any *.tsx under src/pages is
// treated by Next as a route, and a test file has no default export.
describe('feature-flags page getStaticProps', () => {
  const original = process.env.NEXT_PUBLIC_IS_PRODUCTION

  afterEach(() => {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = original
  })

  it('returns notFound in production', () => {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'true'
    expect(getStaticProps({} as GetStaticPropsContext)).toEqual({ notFound: true })
  })

  it('renders the page outside production', () => {
    process.env.NEXT_PUBLIC_IS_PRODUCTION = 'false'
    expect(getStaticProps({} as GetStaticPropsContext)).toEqual({ props: {} })
  })
})

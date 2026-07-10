import type { GetStaticProps } from 'next'
import dynamic from 'next/dynamic'

// The editor UI is referenced ONLY through this guarded dynamic import so its
// whole module graph is dead-code-eliminated in production. The guard MUST be
// the inlined process.env check (foldable at build time), not IS_PRODUCTION.
const FeatureFlagEditor =
  process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
    ? () => null
    : dynamic(() => import('@/features/feature-flags').then((m) => m.FeatureFlagEditor))

// Serve a 404 in production so an accidental /feature-flags hit fails cleanly
// instead of rendering a blank page. The guarded dynamic import above still
// keeps the editor UI out of the production bundle.
export const getStaticProps: GetStaticProps = () => {
  if (process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true') {
    return { notFound: true }
  }
  return { props: {} }
}

export default FeatureFlagEditor

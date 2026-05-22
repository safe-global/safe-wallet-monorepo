/**
 * Compatibility shim for `next/head`.
 * decisions.md: head/meta library is react-helmet-async.
 *
 * The Helmet component preserves the children/JSX mental model of next/head
 * (titles, meta tags, link rels) so the 56 call-sites in apps/web/src don't
 * need to change shape. Apps using this shim must mount <HelmetProvider> in
 * the root tree — see routes/__root.tsx.
 */
import { Helmet } from 'react-helmet-async'
import type { ReactNode } from 'react'

type HeadProps = { children?: ReactNode }

export default function Head({ children }: HeadProps) {
  return <Helmet>{children}</Helmet>
}

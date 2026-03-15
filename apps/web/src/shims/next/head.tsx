/**
 * Shim for `next/head` — uses react-helmet-async to manage `<head>` tags.
 *
 * Drop-in replacement: `<Head><title>…</title></Head>` works unchanged.
 */
import type { ReactNode } from 'react'
import { Helmet } from 'react-helmet-async'

function Head({ children }: { children?: ReactNode }) {
  return <Helmet>{children}</Helmet>
}

export default Head

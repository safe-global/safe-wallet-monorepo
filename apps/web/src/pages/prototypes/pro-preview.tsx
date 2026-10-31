import Head from 'next/head'
import { UnifiedSidebarProPreview } from '@/features/spaces'

export default function ProPreviewPage() {
  return (
    <>
      <Head>
        <title>Safe Pro preview · Design exploration</title>
        <meta name="robots" content="noindex" />
      </Head>
      <UnifiedSidebarProPreview />
    </>
  )
}

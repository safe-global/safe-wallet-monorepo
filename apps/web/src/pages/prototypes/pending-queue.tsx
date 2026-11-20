import Head from 'next/head'
import PendingQueuePrototype from '@/features/spaces/public/components/PendingQueuePrototype'

export default function PendingQueuePage() {
  return (
    <>
      <Head>
        <title>Pending queue · Design exploration</title>
        <meta name="robots" content="noindex" />
      </Head>
      {process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true' ? (
        <main className="p-8">This design prototype is available in preview builds only.</main>
      ) : (
        <PendingQueuePrototype />
      )}
    </>
  )
}

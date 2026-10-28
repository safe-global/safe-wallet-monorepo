import Head from 'next/head'
import { useLoadFeature } from '@/features/__core__'
import { PendingQueuePrototype } from '@/features/spaces'

export default function PendingQueuePage() {
  return (
    <>
      <Head>
        <title>Pending queue · Design exploration</title>
        <meta name="robots" content="noindex" />
      </Head>
      <PendingQueueContent />
    </>
  )
}

function PendingQueueContent() {
  const { PendingQueue, $isDisabled, $isReady, $error } = useLoadFeature(PendingQueuePrototype)
  if ($isDisabled) return <main className="p-8">This design prototype is available in preview builds only.</main>
  if ($error)
    return (
      <main className="p-8" role="alert">
        The design preview could not load. Reload to try again.
      </main>
    )
  if (!$isReady)
    return (
      <main className="p-8" role="status">
        Loading design preview…
      </main>
    )
  return <PendingQueue />
}

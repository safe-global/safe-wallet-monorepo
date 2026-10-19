import { CloudOff } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@safe-global/views/components/ui/empty'

// The skeleton has the shape of the grouped table, so the layout does not move when rows load.
export function QueueSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true" aria-label="Loading transactions">
      {[3, 2].map((rows, section) => (
        <section key={section} className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Card radius="xl" size="none">
            <CardContent>
              <div className="flex flex-col divide-y divide-border px-4">
                {Array.from({ length: rows }, (_, row) => (
                  <div key={row} className="flex h-16 items-center gap-8">
                    <Skeleton className="size-6 shrink-0 rounded-full" />
                    <span className="flex w-56 items-center gap-3">
                      <Skeleton className="size-6 shrink-0 rounded-[4px]" />
                      <span className="flex flex-1 flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </span>
                    </span>
                    <span className="flex w-48 items-center gap-3">
                      <Skeleton className="size-6 shrink-0 rounded-full" />
                      <Skeleton className="h-3.5 w-28" />
                    </span>
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="ml-auto h-6 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  )
}

export function QueueError({ onRetry }: { onRetry: () => void }) {
  return (
    <Empty className="rounded-2xl border border-border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CloudOff />
        </EmptyMedia>
        <EmptyTitle>
          <h2>Couldn&apos;t load the queue</h2>
        </EmptyTitle>
        <EmptyDescription>
          Your proposals and signatures are unaffected. Check your connection and try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  )
}

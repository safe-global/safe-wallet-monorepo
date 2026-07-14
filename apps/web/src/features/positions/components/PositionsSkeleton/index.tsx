import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import EnhancedTable, { type EnhancedTableProps } from '@/components/common/EnhancedTable'

const skeletonCells: EnhancedTableProps['rows'][0]['cells'] = {
  name: {
    rawValue: '0x0',
    content: (
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-md" />
        <div>
          <Skeleton className="h-6 w-[100px]" />
          <Skeleton className="h-5 w-[80px]" />
        </div>
      </div>
    ),
  },
  balance: {
    rawValue: '0',
    content: (
      <div className="text-right">
        <Skeleton className="ml-auto h-6 w-[60px]" />
      </div>
    ),
  },
  value: {
    rawValue: '0',
    content: (
      <div className="text-right">
        <Skeleton className="ml-auto h-6 w-[50px]" />
        <Skeleton className="ml-auto h-4 w-[40px]" />
      </div>
    ),
  },
}

const skeletonRows: EnhancedTableProps['rows'] = Array(3).fill({ cells: skeletonCells })

const PositionsSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Accordion defaultValue={['skeleton']}>
          <AccordionItem value="skeleton" className="border-b-0">
            <AccordionTrigger className="overflow-x-auto px-6 py-4">
              <div className="flex w-full items-center gap-4">
                <Skeleton className="size-10 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-[120px]" />
                  <Skeleton className="h-5 w-[80px]" />
                </div>
                <Skeleton className="h-6 w-[60px]" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 pt-0">
              <div>
                <EnhancedTable
                  rows={skeletonRows}
                  headCells={[
                    { id: 'name', label: 'Loading...', width: '25%', disableSort: true },
                    { id: 'balance', label: 'Balance', width: '35%', align: 'right', disableSort: true },
                    { id: 'value', label: 'Value', width: '40%', align: 'right', disableSort: true },
                  ]}
                  compact
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

export default PositionsSkeleton

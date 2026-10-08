import type { ReactElement, ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export type DecodedTxsViewProps = {
  count: number
  renderHeader: (props: { title: string; compact: boolean }) => ReactNode
  renderTx: (index: number, props: { actionTitle: string; variant: 'outlined' }) => ReactNode
}

const DecodedTxsView = ({ count, renderHeader, renderTx }: DecodedTxsViewProps): ReactElement => {
  return (
    <>
      {renderHeader({ title: 'Batched transactions', compact: true })}

      <Card variant="muted" size="none" className="mt-2">
        <CardContent>
          {/* Padding outside, clipping inside: the action rows are white on this card's grey, so
              without a rounded clip their square corners sat inside its 16px curve. 8px = the card's
              16px less the 8px inset, which keeps the two concentric. */}
          <div className="p-2">
            <div className="flex flex-col divide-y divide-border overflow-hidden rounded-sm">
              {Array.from({ length: count }).map((_, idx) =>
                renderTx(idx, { actionTitle: `${idx + 1}`, variant: 'outlined' }),
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export { DecodedTxsView }

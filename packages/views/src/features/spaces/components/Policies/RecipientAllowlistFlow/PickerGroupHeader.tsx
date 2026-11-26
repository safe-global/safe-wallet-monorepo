import type { ReactElement } from 'react'

type PickerGroupHeaderProps = {
  label: string
  count: number
}

/** The header bar over one group of a picker list, such as the tokens of the spending limits. */
const PickerGroupHeader = ({ label, count }: PickerGroupHeaderProps): ReactElement => (
  // Sticky over a card-coloured strip, so rows scrolling under it don't show through the inset around the bar
  <div className="sticky top-0 z-10 bg-card pb-1" data-testid="picker-group-header">
    <div className="flex h-10 items-center gap-1.5 rounded-lg bg-muted px-4 text-xs leading-4 font-semibold text-muted-foreground uppercase">
      <span className="truncate">{label}</span>
      <span className="ml-auto">{count}</span>
    </div>
  </div>
)

export default PickerGroupHeader

/** Matches AddressInput `.inputWrapper` sizing: 66px height, 12px/16px padding. */
export const largeFormFieldSurfaceClassName =
  'min-h-[66px] h-[66px] rounded-[calc(var(--radius)-2px)] border-border bg-card px-4 shadow-none focus-visible:border-border focus-visible:ring-1 focus-visible:ring-ring'

export const largeFormInputGroupClassName = `${largeFormFieldSurfaceClassName} [&_[data-slot=input-group-control]]:border-0 [&_[data-slot=input-group-control]]:px-0 [&_[data-slot=input-group-control]]:shadow-none [&_[data-slot=input-group-control]]:focus-visible:ring-0 [&_[data-slot=input-group-addon][data-align=inline-end]]:pr-0`

export const largeFormFieldRowClassName = 'flex h-[66px] min-w-0 items-center'

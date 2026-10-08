import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export type DialogConfirmButtonViewProps = {
  label: ReactNode
  onClick?: () => void
  type: 'button' | 'submit'
  form?: string
  disabled: boolean
  loading: boolean
  destructive: boolean
  testId?: string
}

export function DialogConfirmButtonView({
  label,
  onClick,
  type,
  form,
  disabled,
  loading,
  destructive,
  testId,
}: DialogConfirmButtonViewProps): ReactElement {
  return (
    <Button
      variant={destructive ? 'destructive' : 'default'}
      size="submit"
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
    >
      {loading ? <Spinner /> : label}
    </Button>
  )
}

export type DialogActionsViewProps = {
  confirmButton: ReactNode
  confirmTooltip?: ReactNode
  confirmLoading: boolean
  onCancel?: () => void
  cancelLabel?: string
  cancelDisabled: boolean
  cancelTestId?: string
  wrapperClassName?: string
}

export function DialogActionsView({
  confirmButton,
  confirmTooltip,
  confirmLoading,
  onCancel,
  cancelLabel = 'Cancel',
  cancelDisabled,
  cancelTestId,
  wrapperClassName,
}: DialogActionsViewProps): ReactElement {
  return (
    <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', wrapperClassName)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          size="submit"
          onClick={onCancel}
          disabled={cancelDisabled || confirmLoading}
          data-testid={cancelTestId}
          className="sm:mr-auto"
        >
          {cancelLabel}
        </Button>
      )}
      {confirmTooltip ? (
        <Tooltip>
          <TooltipTrigger render={<div className="inline-flex" />}>{confirmButton}</TooltipTrigger>
          <TooltipContent>{confirmTooltip}</TooltipContent>
        </Tooltip>
      ) : (
        confirmButton
      )}
    </div>
  )
}

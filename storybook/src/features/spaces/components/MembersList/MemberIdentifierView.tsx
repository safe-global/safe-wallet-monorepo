import type { ReactNode, Ref } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export type MemberIdentifierViewProps = {
  value: string
  isAddress: boolean
  /** The caller's className for the outer span. */
  wrapperClassName?: string
  /** Whether the full value fits next to the copy button, measured by the container. */
  fits: boolean
  containerRef: Ref<HTMLSpanElement>
  measureRef: Ref<HTMLSpanElement>
  copyRef: Ref<HTMLSpanElement>
  renderCopyButton: (props: { text: string; initialToolTipText: string }) => ReactNode
}

export const MemberIdentifierView = ({
  value,
  isAddress,
  wrapperClassName,
  fits,
  containerRef,
  measureRef,
  copyRef,
  renderCopyButton,
}: MemberIdentifierViewProps) => {
  const isShortened = isAddress && !fits
  const label = isShortened ? shortenAddress(value) : value

  return (
    <span ref={containerRef} className={cn('relative flex min-w-0 items-center gap-1', wrapperClassName)}>
      {isAddress && fits ? (
        <span className="block min-w-0 truncate">{label}</span>
      ) : (
        <Tooltip>
          <TooltipTrigger render={<span className="block min-w-0 truncate" />}>{label}</TooltipTrigger>
          <TooltipContent align="start">{value}</TooltipContent>
        </Tooltip>
      )}
      <span ref={copyRef} className="inline-flex shrink-0">
        {renderCopyButton({ text: value, initialToolTipText: isAddress ? 'Copy address' : 'Copy email' })}
      </span>
      <span
        ref={measureRef}
        aria-hidden
        data-value={value}
        className="invisible absolute top-0 left-0 whitespace-nowrap before:content-[attr(data-value)]"
      />
    </span>
  )
}

import { useEffect, useRef, useState } from 'react'
import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import CopyButton from '@/components/common/CopyButton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export const getMemberIdentifier = ({ user }: MemberDto) => {
  if (user.email) return { value: user.email, isAddress: false }
  if (user.address) return { value: user.address, isAddress: true }
  return null
}

const useFitsFullValue = (value: string) => {
  const containerRef = useRef<HTMLSpanElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const copyRef = useRef<HTMLSpanElement>(null)
  const [fits, setFits] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    const copy = copyRef.current
    if (!container || !measure || !copy) return
    const update = () => {
      const gap = parseFloat(getComputedStyle(container).columnGap) || 0
      setFits(measure.offsetWidth + copy.offsetWidth + gap <= container.clientWidth)
    }
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [value])

  return { containerRef, measureRef, copyRef, fits }
}

const IdentifierLabel = ({
  value,
  isAddress,
  className,
}: {
  value: string
  isAddress: boolean
  className?: string
}) => {
  const { containerRef, measureRef, copyRef, fits } = useFitsFullValue(value)
  const isShortened = isAddress && !fits
  const label = isShortened ? shortenAddress(value) : value

  return (
    <span ref={containerRef} className={cn('relative flex min-w-0 items-center gap-1', className)}>
      {isAddress && fits ? (
        <span className="block min-w-0 truncate">{label}</span>
      ) : (
        <Tooltip>
          <TooltipTrigger render={<span className="block min-w-0 truncate" />}>{label}</TooltipTrigger>
          <TooltipContent align="start">{value}</TooltipContent>
        </Tooltip>
      )}
      <span ref={copyRef} className="inline-flex shrink-0">
        <CopyButton text={value} initialToolTipText={isAddress ? 'Copy address' : 'Copy email'} />
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

const MemberIdentifier = ({ member, className }: { member: MemberDto; className?: string }) => {
  const identifier = getMemberIdentifier(member)
  if (!identifier) return null
  return <IdentifierLabel {...identifier} className={className} />
}

export default MemberIdentifier

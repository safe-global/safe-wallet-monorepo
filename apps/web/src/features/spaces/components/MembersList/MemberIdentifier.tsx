import { useEffect, useRef, useState } from 'react'
import { type MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import CopyButton from '@/components/common/CopyButton'
import { MemberIdentifierView } from '@views/features/spaces/components/MembersList/MemberIdentifierView'

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
  wrapperClassName,
}: {
  value: string
  isAddress: boolean
  wrapperClassName?: string
}) => {
  const { containerRef, measureRef, copyRef, fits } = useFitsFullValue(value)

  return (
    <MemberIdentifierView
      value={value}
      isAddress={isAddress}
      wrapperClassName={wrapperClassName}
      fits={fits}
      containerRef={containerRef}
      measureRef={measureRef}
      copyRef={copyRef}
      renderCopyButton={(props) => <CopyButton {...props} />}
    />
  )
}

const MemberIdentifier = ({ member, className }: { member: MemberDto; className?: string }) => {
  const identifier = getMemberIdentifier(member)
  if (!identifier) return null
  return <IdentifierLabel {...identifier} wrapperClassName={className} />
}

export default MemberIdentifier

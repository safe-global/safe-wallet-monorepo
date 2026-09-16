import HypernativeLogoSvg from '@/public/images/hypernative/hypernative-logo.svg'
import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { cn } from '@/utils/cn'

interface HypernativeLogoProps {
  className?: string
  fill?: string
  style?: CSSProperties
}

/**
 * HypernativeLogo wraps the logo SVG.
 * It dynamically updates the gradient ID to ensure multiple instances on a page don't collide.
 */
const HypernativeLogo = ({ className, fill, style }: HypernativeLogoProps) => {
  const uniqueId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Find the SVG element inside the wrapper
    const svg = containerRef?.current?.querySelector('svg')
    if (!svg) return

    // Find the linearGradient element and update its ID to a unique one
    const gradient = svg.querySelector('linearGradient')
    if (gradient) {
      const gradientId = `hnGradient-${uniqueId}`
      gradient.setAttribute('id', gradientId)
      svg.querySelector(`[fill="url(#${gradient.id})"]`)?.setAttribute('fill', `url(#${gradientId})`)
    }
  }, [uniqueId])

  return (
    <div ref={containerRef} className="inline-flex">
      <HypernativeLogoSvg
        className={cn(fill ? '[&_.hypernative-logo-fill]:fill-[var(--hn-logo-fill)]' : undefined, className)}
        style={{ ...style, ...(fill ? ({ '--hn-logo-fill': fill } as CSSProperties) : {}) }}
      />
    </div>
  )
}

export default HypernativeLogo

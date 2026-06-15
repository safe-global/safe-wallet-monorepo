import { SvgIcon, type SvgIconProps } from '@mui/material'
import HypernativeLogoSvg from '@/public/images/hypernative/hypernative-logo.svg'
import { useEffect, useId, useRef } from 'react'

interface HypernativeLogoProps extends Omit<SvgIconProps, 'component'> {
  component?: never // Prevent overriding component prop
}

/**
 * HypernativeLogo wraps the logo SVG.
 * It dynamically updates the gradient ID to ensure multiple instances on a page don't collide.
 */
const HypernativeLogo = (props: HypernativeLogoProps) => {
  const uniqueId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Find the SVG element inside the SvgIcon wrapper
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

  const sx = {
    ...props.sx,
    ...(props.fill ? { '.hypernative-logo-fill': { fill: props.fill } } : {}),
  }

  return (
    <div ref={containerRef} style={{ display: 'inline-flex' }}>
      <SvgIcon {...props} sx={sx} component={HypernativeLogoSvg} inheritViewBox />
    </div>
  )
}

export default HypernativeLogo

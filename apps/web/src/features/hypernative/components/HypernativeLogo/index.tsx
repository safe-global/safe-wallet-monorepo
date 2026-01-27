import { useId, useRef, useEffect } from 'react'
import { SvgIcon, type SvgIconProps } from '@mui/material'
import HypernativeLogoSvg from '@/public/images/hypernative/hypernative-logo.svg'

interface HypernativeLogoProps extends Omit<SvgIconProps, 'component'> {
  component?: never // Prevent overriding component prop
}

/**
 * HypernativeLogo component that wraps the SVG to prevent ID collisions
 * when rendered multiple times. Uses React's useId hook to generate unique IDs.
 */
const HypernativeLogo = (props: HypernativeLogoProps) => {
  const uniqueId = useId()
  const filterId = `invert-${uniqueId}`
  const maskId = `logoMask-${uniqueId}`
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Find the SVG element inside the SvgIcon wrapper
    const svg = containerRef.current.querySelector('svg')
    if (!svg) return

    // Find and update filter ID
    const filter = svg.querySelector('#invert')
    if (filter) {
      filter.setAttribute('id', filterId)
    }

    // Find and update mask ID
    const mask = svg.querySelector('#logoMask')
    if (mask) {
      mask.setAttribute('id', maskId)
    }

    // Update image filter reference
    const image = svg.querySelector('mask image')
    if (image) {
      image.setAttribute('filter', `url(#${filterId})`)
    }

    // Update rect mask reference
    const rect = svg.querySelector('rect')
    if (rect) {
      rect.setAttribute('mask', `url(#${maskId})`)
    }
  }, [filterId, maskId])

  return (
    <div ref={containerRef} style={{ display: 'inline-flex' }}>
      <SvgIcon {...props} component={HypernativeLogoSvg} inheritViewBox />
    </div>
  )
}

export default HypernativeLogo

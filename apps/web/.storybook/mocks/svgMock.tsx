import React from 'react'

// Mock SVG component for Storybook Vite builder
// Vite doesn't process SVG imports from the public directory through SVGR
const SvgMock = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg ref={ref} {...props} data-testid="svg-mock">
    <rect width="100%" height="100%" fill="currentColor" opacity="0.1" />
  </svg>
))

SvgMock.displayName = 'SvgMock'

export default SvgMock

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
  const sx = {
    ...props.sx,
    ...(props.fill ? { '.hypernative-logo-fill': { fill: props.fill } } : {}),
  }

  return <SvgIcon {...props} sx={sx} component={HypernativeLogoSvg} inheritViewBox />
}

export default HypernativeLogo

declare module '*.svg' {
  import type { FC, SVGProps } from 'react'
  const Component: FC<SVGProps<SVGSVGElement> & { title?: string; alt?: string }>
  export default Component
}

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}

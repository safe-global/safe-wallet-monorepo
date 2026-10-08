import type { ReactNode } from 'react'

interface SectionWrapperProps {
  label: string
  children: ReactNode
}

const SectionWrapper = ({ label, children }: SectionWrapperProps) => {
  return (
    <div className="flex flex-col">
      <p className="px-4 py-2 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export default SectionWrapper

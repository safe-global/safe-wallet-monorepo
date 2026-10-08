import type { ReactNode } from 'react'

export type SignerSelectViewProps = {
  children: ReactNode
}

export const SignerSelectView = ({ children }: SignerSelectViewProps) => {
  return <div className="mt-6 flex flex-col gap-4">{children}</div>
}

import type { ReactNode } from 'react'

export type ModulesSettingsViewProps = {
  safeModules: ReactNode
  transactionGuards: ReactNode
  fallbackHandler: ReactNode
}

export const ModulesSettingsView = ({ safeModules, transactionGuards, fallbackHandler }: ModulesSettingsViewProps) => {
  return (
    <main>
      <div className="flex flex-col gap-4">
        <div>{safeModules}</div>

        <div>{transactionGuards}</div>

        <div>{fallbackHandler}</div>
      </div>
    </main>
  )
}
